import axios from 'axios';
import { TypedEmitter } from 'tiny-typed-emitter';
import { Colours } from '../types/Colours';
import { ProgressLogger } from './ProgressLogger';

export interface ChunkEmitterEvents<T> {
    /** Emitted data when a chunk has been fetched. */
    chunk: (data: T[]) => void;

    /** Emitted when all chunks have been fetched. */
    done: (errors: FetchError[]) => void;
}

export type ChunkEmitter<T> = TypedEmitter<ChunkEmitterEvents<T>>;

export interface FetchError {
    key: string;
    error: unknown;
}

/** Handles making large amount of asynchronous function calls in chunks. */
export class MassRequester {
    /** Whether to log status updates using a {@link ProgressLogger}. */
    private readonly _loggingEnabled: boolean;

    /** Maximum number of parallel requests allowed to occur. */
    private readonly _chunkSize: number;

    /** Maximum number of times to attempt requests. */
    private readonly _maxAttempts: number;

    /**
     * If a request fails, how long to wait before retrying, in milliseconds.
     *
     * This number is multiplied by the attempt number.
     *
     * For example, a value of 1000 (1 second) will result in a 1 second delay between the first and second attempts, a
     * 2 second delay between the second and third attempts, and so on...
     */
    private readonly _retryCooldownMultiplier: number;

    /** Number of milliseconds between each sequential chunk fetch. */
    private readonly _timeBetweenChunkFetches: number;

    /**
     * Creates a new {@link MassRequester} instance.
     * @param {boolean} loggingEnabled Whether to log status updates using a {@link ProgressLogger}.
     * @param {number} chunkSize Maximum number of parallel requests allowed to occur.
     * @param {number} maxAttempts Maximum number of times to attempt requests.
     * @param {number} retryCooldownMultiplier If a request fails, how long to wait before retrying, in milliseconds.
     * @param {number} timeBetweenChunkFetches Number of milliseconds between each sequential chunk fetch.
     */
    public constructor(
        loggingEnabled: boolean,
        chunkSize: number,
        maxAttempts: number,
        retryCooldownMultiplier: number,
        timeBetweenChunkFetches: number,
    ) {
        this._loggingEnabled = loggingEnabled;
        this._chunkSize = chunkSize;
        this._maxAttempts = maxAttempts;
        this._retryCooldownMultiplier = retryCooldownMultiplier;
        this._timeBetweenChunkFetches = timeBetweenChunkFetches;
    }

    /**
     * Collects all results from a chunk emitter, and returns them once the emitter is done.
     *
     * It is not recommended to use this method for large amounts of data, as it will store all the data in memory,
     * which defeats the whole purpose of having an emitter to begin with.
     */
    public static collectAllFromEmitter<T>(emitter: ChunkEmitter<T>): Promise<T[]> {
        return new Promise((resolve) => {
            const results: T[] = [];

            emitter.on('chunk', (chunk) => {
                results.push(...chunk);
            });

            emitter.on('done', () => {
                resolve(results);
            });
        });
    }

    /**
     * Performs a large amount of asynchronous function calls in chunks.
     *
     * This is done asynchronously using an {@link ChunkEmitter event emitter} so that the chunks can be processed as
     * they come in, which helps reduce memory usage.
     *
     * For more information about the chunking process, see {@link chunkedFetch}.
     */
    public createChunkEmitter<TArgs, TResolve>(
        fn: (args: TArgs) => Promise<TResolve>,
        argsArray: TArgs[],
        keyFn: (args: TArgs) => string,
        failValue: TResolve,
    ): ChunkEmitter<TResolve> {
        const emitter = new TypedEmitter<ChunkEmitterEvents<TResolve>>();

        if (argsArray.length === 0) {
            // race condition where a 0 length array results in an emitter that emits 'done' before listeners are
            // attached, so we need to delay the 'done' event by moving it to the next event loop
            setTimeout(() => {
                emitter.emit('done', []);
                emitter.removeAllListeners();
            }, 0);
        } else {
            this.chunkedFetch(fn, argsArray, keyFn, failValue, emitter).then((errors) => {
                emitter.emit('done', errors);
                emitter.removeAllListeners();
            });
        }

        return emitter;
    }

    /**
     * Splits up a large amount of asynchronous function calls into chunks.
     * @param {(args: TArgs) => Promise<TResolve>} fn The asynchronous function to call. If a call to this function
     * results in a rejected promise, it will be re-attempted {@link _maxAttempts} times (see {@link multiAttempt}).
     * @param {TArgs[]} argsArray Arguments to pass to each call of the function, the length of this array determines
     * the number of calls.
     * @param {(args: TArgs) => string} keyFn A function that produces a unique identifier for each call, this is used
     * if a call fails, so that it is clear which call resulted in the error.
     * @param {TResolve} failValue The resolved value of calls that fail after exhausting all their attempts.
     * @param {ChunkEmitter<TResolve>} emitter The event emitter to emit completed chunks to.
     * @returns {Promise<FetchError[]>} Errors collected across all chunks.
     *
     * Chunks are processed sequentially, with the function calls within each chunk being awaited in parallel
     * (using {@link Promise.all Promise.all}).
     *
     * After each chunk is processed, all of its resolved values are emitted using the supplied {@link ChunkEmitter}.
     *
     * All of the chunks' rejected values are collected as an array of {@link FetchError FetchErrors}, this
     * is returned after all chunks have been processed.
     */
    private async chunkedFetch<TArgs, TResolve>(
        fn: (args: TArgs) => Promise<TResolve>,
        argsArray: TArgs[],
        keyFn: (args: TArgs) => string,
        failValue: TResolve,
        emitter: ChunkEmitter<TResolve>,
    ): Promise<FetchError[]> {
        const itemCount = argsArray.length;
        const chunkCount = Math.ceil(itemCount / this._chunkSize);

        // errors across all chunks
        const errors: FetchError[] = [];

        for (let chunk = 0; chunk < chunkCount; chunk++) {
            const chunkStartIndex = chunk * this._chunkSize;
            const chunkEndIndex = (chunk + 1) * this._chunkSize;

            const chunkArgs = argsArray.slice(chunkStartIndex, chunkEndIndex);

            const trueChunkLength = chunkArgs.length; // last chunk may be smaller than chunkSize

            const logger = this._loggingEnabled
                ? new ProgressLogger(
                      `Chunk ${(chunk + 1).toString().padStart(chunkCount.toString().length, ' ')} / ${chunkCount}`,
                      trueChunkLength,
                  )
                : null;

            // each promise represents a single call of the function
            const promiseArray = new Array<Promise<TResolve>>(trueChunkLength);

            for (let i = 0; i < trueChunkLength; i++) {
                const args = chunkArgs[i];

                promiseArray[i] = new Promise<TResolve>((resolve) => {
                    this.multiAttempt(fn, args, (status) => logger?.log(i, status))
                        .then(resolve)
                        .catch((error) => {
                            errors.push({ key: keyFn(args), error });
                            // you may be asking, why have a fail value? why not just not resolve the promise, and have
                            // promiseArray be appended to on resolve instead of fixed-length?
                            //
                            // this is because having a fixed-length array preserves the original order of the calls.
                            // we also can't just resolve with a hard-coded fail value (e.g. null, undefined), because
                            // it could conflict with TResolve
                            resolve(failValue);
                        });
                });
            }

            const fetchedChunkData = await Promise.all(promiseArray);

            logger?.close();

            emitter.emit('chunk', fetchedChunkData);

            if (chunk !== chunkCount - 1) {
                await new Promise((resolve) => setTimeout(resolve, this._timeBetweenChunkFetches));
            }
        }

        return errors;
    }

    /**
     * Attempts to successfully run an asynchronous function, retrying on failure.
     * @param {(args: TArgs) => Promise<TReturn>} fn The asynchronous function to run.
     * @param {TArgs} args Arguments to pass into the function.
     * @param {(status: ProgressLoggerStatuses) => void} [logFn] A function to log status updates with.
     * @returns The successful return value of the function.
     * @throws Throws an error if the function fails after the {@link _maxAttempts maximum number} of retries.
     */
    private async multiAttempt<TArgs, TReturn>(
        fn: (args: TArgs) => Promise<TReturn>,
        args: TArgs,
        logFn?: (msg: string) => void,
    ): Promise<TReturn> {
        let numAttempts = 0;
        let latestError: unknown;

        while (numAttempts < this._maxAttempts) {
            try {
                const res = await fn(args);

                logFn?.(`${Colours.FgGreen}x${Colours.Reset}`);

                return res;
            } catch (error) {
                numAttempts++;

                if (numAttempts === this._maxAttempts) {
                    logFn?.(`${Colours.FgRed}e${Colours.Reset}`);
                    latestError = error;
                } else {
                    logFn?.(`${Colours.FgYellow}r${Colours.Reset}`);
                    await new Promise((resolve) => setTimeout(resolve, this._retryCooldownMultiplier * numAttempts));
                }
            }
        }

        throw latestError;
    }

    /**
     * Logs an array of errors.
     * @param {FetchError[]} errorArray Array of {@link FetchError} objects.
     * @param {string} title Title of the error log.
     */
    public static logErrors(errorArray: FetchError[], title: string): void {
        if (errorArray.length === 0) return;

        console.log(`${Colours.FgRed}${errorArray.length} Errored ${title}:${Colours.Reset}`);

        for (const { error, key } of errorArray) {
            console.log(`${key}: ${MassRequester.makeErrorMessage(error)}`, error);
        }
    }

    private static makeErrorMessage(err: unknown): string {
        if (axios.isAxiosError(err)) {
            if (err.response !== undefined) return `${err.response.status} (${err.response.statusText})`;
            if (err.status !== undefined) return `${err.status} (${err.name})`;
            if (err.code !== undefined) return `${err.code} (${err.name})`;
            return `Unknown Axios Error (${err.name})`;
        }
        if (err instanceof Error) return `${err.name}`;
        return 'Unknown';
    }
}
