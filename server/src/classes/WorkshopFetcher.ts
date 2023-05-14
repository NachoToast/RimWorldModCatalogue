import axios, { AxiosRequestConfig } from 'axios';
import { Colours } from '../types/Colours';
import { FetchError } from '../types/FetchError';
import { Mod } from '../types/Mod';
import { PageResponse } from '../types/PageResponse';
import { ModId } from '../types/Utility';
import { ProgressLogger } from './ProgressLogger';
import { WorkshopParser } from './WorkshopParser';

/**
 * Handles fetching of workshop items from the Steam Workshop.
 *
 * The static {@link fetchSingleItem} method can be used to fetch a single workshop item.
 *
 * The basic lifecycle of a fetcher is:
 * 1. Instantiation
 * 2. {@link fetchNumPages Fetching number of pages}.
 * 3. {@link fetchAllPages Fetching all page data}.
 * 4. {@link fetchAllItems Fetching all item data}.
 *
 * @example
 * ```ts
 * const fetcher = new WorkshopFetcher(true);
 * const pageData = await fetcher.fetchNumPages();
 * const modIds = await fetcher.fetchAllPages(pageData);
 * const mods = await fetcher.fetchAllItems(modIds);
 * ```
 *
 * @example
 * ```ts
 * const fetcher = new WorkshopFetcher(true);
 *
 * console.log('[0/3] Fetching number of pages...');
 * const pageData = await fetcher.fetchNumPages();
 *
 * console.log(`[1/3] Fetching mod IDs from ${pageData.pageCount} Pages...`);
 * const modIds = await fetcher.fetchAllPages(pageData);
 *
 * console.log(`[2/3] Fetching data for ${modIds.length} mods...`);
 * const allMods = await fetcher.fetchAllItems(modIds);
 *
 * console.log(`[3/3] Done! Fetched ${allMods.length} mods`);
 * ```
 */
export class WorkshopFetcher {
    private static readonly _pageUrl: string = 'https://steamcommunity.com/workshop/browse' as const;
    private static readonly _itemUrl: string = 'https://steamcommunity.com/sharedfiles/filedetails';

    /** Maximum number of times to attempt network requests. */
    private static readonly _maxAttempts: number = 3;

    /** Maximum number of parallel requests. */
    private static readonly _chunkSize: number = 300;

    /**
     * If a request fails, how long to wait before retrying, in milliseconds.
     *
     * This number is multiplied by the attempt number.
     *
     * For example, a value of 1000 (1 second) will result in a 1 second delay between the first and second attempts, a
     * 2 second delay between the second and third attempts, and so on...
     */
    private static readonly _retryCooldownMultiplier: number = 1_000;

    private readonly _params: AxiosRequestConfig['params'];

    /** Whether to log mass network requests using a {@link ProgressLogger}. */
    private readonly _verbose: boolean;

    /**
     * Instantiates a new workshop fetcher.
     * @param {boolean} verbose Whether to log mass network requests using a {@link ProgressLogger}.
     * @param {number} postedSince Timestamp (in seconds) for start of 'posted date' range filter.
     * @param {number} updatedSince Timestamp (in seconds) for start of 'date last updated' range filter.
     */
    public constructor(verbose: boolean = false, postedSince: number = 0, updatedSince: number = 0) {
        this._verbose = verbose;

        this._params = {
            appid: 294100,
            section: 'readytouseitems',
            'requiredtags[0]': 'Mod',
            'requiredtags[1]': '1.4',
            created_date_range_filter_start: postedSince,
            created_date_range_filter_end: 0,
            updated_date_range_filter_start: updatedSince,
            updated_date_range_filter_end: 0,
            actualsort: 'trend',
            days: -1,
        };
    }

    /**
     * Fetches the number of pages of mods on the workshop.
     *
     * This is done by fetching the first page and seeing what the maximum page number on it is.
     *
     * Since this fetches the first page, it also fetches the mod IDs on that page.
     *
     * @returns {Promise<PageResponse>} The response from the first page, this is required to call
     * {@link fetchAllPages}.
     */
    public async fetchNumPages(): Promise<PageResponse> {
        const { data } = await axios.get<string>(WorkshopFetcher._pageUrl, {
            params: {
                ...this._params,
                p: 1,
            },
        });

        return WorkshopParser.parsePage(data, true);
    }

    /**
     * Fetches the content of each page of mods on the workshop.
     * @param {PageResponse} pageResponse The response from {@link fetchNumPages}, this is required as it contains the
     * number of pages needed to be fetched, as well as the IDs of all the mods on the first page.
     * @returns {Promise<ModId[]>} The mod IDs from all pages, this is required to call {@link fetchAllItems}.
     */
    public async fetchAllPages(pageResponse: PageResponse): Promise<ModId[]> {
        const { pageCount, ids } = pageResponse;

        if (pageCount === 0) return [];

        const argsArray = new Array(pageCount - 1).fill(0).map((_, i) => i + 2);
        const keyArray = new Array(pageCount - 1).fill(0).map((_, i) => (i + 2).toString());
        const erroredPages: FetchError[] = [];

        const fetchedData = await this.chunkedFetch(
            (args) => this.fetchPageItems(args),
            argsArray,
            keyArray,
            erroredPages,
            [],
        );

        fetchedData.splice(0, 0, ids);

        ProgressLogger.logErrors(erroredPages, 'pages');

        return fetchedData.flat();
    }

    /**
     * Internal helper method used by {@link fetchAllPages} to fetch an individual page.
     * @param {number} pageNumber The page number
     * @returns {Promise<ModId[]>} The mod IDs on the page.
     *
     * The page number should start at 2, since the first page is fetched by {@link fetchNumPages}.
     */
    private async fetchPageItems(pageNumber: number): Promise<ModId[]> {
        const { data } = await axios.get<string>(WorkshopFetcher._pageUrl, {
            params: {
                ...this._params,
                p: pageNumber,
            },
        });

        return WorkshopParser.parsePage(data);
    }

    /**
     * Fetches the content of each mod on the workshop.
     * @param {ModId[]} ids The mod IDs from all pages, this is returned from {@link fetchAllPages}.
     * @returns {Promise<Mod[]>} The content of each mod on the workshop.
     */
    public async fetchAllItems(ids: ModId[]): Promise<Mod[]> {
        const itemCount = ids.length;

        const argsArray = new Array(itemCount).fill(0).map((_, i) => ids[i]);
        const keyArray = argsArray;
        const erroredItems: FetchError[] = [];

        const fetchedData = await this.chunkedFetch(
            (args) => WorkshopFetcher.fetchSingleItem(args),
            argsArray,
            keyArray,
            erroredItems,
            null,
        );

        ProgressLogger.logErrors(erroredItems, 'items');

        return fetchedData.filter((e): e is Mod => e !== null);
    }

    /**
     * Fetches a single workshop item.
     *
     * Used internally by {@link fetchAllItems}.
     */
    public static async fetchSingleItem(id: ModId): Promise<Mod> {
        const { data } = await axios.get<string>(WorkshopFetcher._itemUrl, {
            params: {
                id,
            },
        });

        const parser = new WorkshopParser(data);

        return {
            _id: id,
            thumbnail: parser.getThumbnail(),
            title: parser.getTitle(),
            description: parser.getDescription(),
            ratingStars: parser.getRatingStars(),
            ratingCount: parser.getRatingCount(),
            authors: parser.getAuthors(),
            tags: parser.getTags(),
            dlcs: parser.getDlcs(),
            size: parser.getSize(),
            posted: parser.getPosted(),
            updated: parser.getUpdated(),
            catalogueLastUpdated: new Date().toISOString(),
            statsVisitors: parser.getVisitors(),
            statsSubscribers: parser.getSubscribers(),
            statsFavourites: parser.getFavourites(),
        };
    }

    /**
     * Performs a large amount of asynchronous requests in chunks.
     * @param {(args: TArgs) => Promise<TResolve>} fn The asynchronous function to call. This will be attempted
     * {@link _maxAttempts} times (for every item in {@link argsArray}).
     * @param {TArgs[]} argsArray Arguments to pass to each call of the function, the length of this array determines
     * the number of calls.
     * @param {string[]} keyArray Unique identifier for each call, used for logging errors.
     * @param {FetchError[]} errorArray Array to store errors in.
     * @param {TResolve} failValue The value to return if a call fails after exhausting all attempts.
     * @returns {Promise<TResolve[]>}
     */
    private async chunkedFetch<TArgs, TResolve>(
        fn: (args: TArgs) => Promise<TResolve>,
        argsArray: TArgs[],
        keyArray: string[],
        errorArray: FetchError[],
        failValue: TResolve,
    ): Promise<TResolve[]> {
        const itemCount = argsArray.length;
        const chunkCount = Math.ceil(itemCount / WorkshopFetcher._chunkSize);

        const output: TResolve[] = new Array(itemCount);

        for (let chunk = 0; chunk < chunkCount; chunk++) {
            const chunkStartIndex = chunk * WorkshopFetcher._chunkSize;
            const chunkEndIndex = (chunk + 1) * WorkshopFetcher._chunkSize;

            const chunkArgs = argsArray.slice(chunkStartIndex, chunkEndIndex);
            const chunkKeys = keyArray.slice(chunkStartIndex, chunkEndIndex);

            const trueChunkLength = chunkArgs.length;

            let logger: ProgressLogger | undefined;

            if (this._verbose) {
                console.log(
                    `Fetching chunk (${(chunk + 1)
                        .toString()
                        .padStart(chunkCount.toString().length, ' ')}/${chunkCount})`,
                );
                logger = new ProgressLogger(trueChunkLength);
            }

            const promiseArray = new Array<Promise<TResolve>>(trueChunkLength);

            for (let i = 0; i < trueChunkLength; i++) {
                const args = chunkArgs[i];
                const key = chunkKeys[i];

                promiseArray[i] = new Promise<TResolve>((resolve) => {
                    WorkshopFetcher.multiAttempt(fn, args, (msg) => logger?.log(i, msg))
                        .then(resolve)
                        .catch((error) => {
                            errorArray.push({
                                key,
                                message: WorkshopFetcher.handleError(error),
                                error,
                            });
                            resolve(failValue);
                        });
                });
            }

            const fetchedChunkData = await Promise.all(promiseArray);

            logger?.close();

            for (let i = 0; i < trueChunkLength; i++) {
                output[chunkStartIndex + i] = fetchedChunkData[i];
            }
        }

        return output;
    }

    /**
     * Attempts to successfully run an asynchronous function mutliple times.
     * @param {(args: TArgs) => Promise<TReturn>} fn The asynchronous function to run.
     * @param {TArgs} args Arguments to pass into the function.
     * @param {(msg: string) => void} [logFn] A function to log messages with.
     * @returns The successful return value of the function.
     * @throws Throws an error if the function fails after the {@link _maxAttempts maximum number} of attempts.
     */
    private static async multiAttempt<TArgs, TReturn>(
        fn: (args: TArgs) => Promise<TReturn>,
        args: TArgs,
        logFn?: (msg: string) => void,
    ): Promise<TReturn> {
        let numAttempts = 0;
        let latestError: unknown;

        while (numAttempts < WorkshopFetcher._maxAttempts) {
            try {
                const res = await fn(args);

                logFn?.(`${Colours.FgGreen}x${Colours.Reset}`);

                return res;
            } catch (error) {
                numAttempts++;

                if (numAttempts === WorkshopFetcher._maxAttempts) {
                    logFn?.(`${Colours.FgRed}e${Colours.Reset}`);
                    latestError = error;
                } else {
                    logFn?.(`${Colours.FgYellow}e${Colours.Reset}`);
                    await new Promise((resolve) =>
                        setTimeout(resolve, WorkshopFetcher._retryCooldownMultiplier * numAttempts),
                    );
                }
            }
        }

        throw latestError;
    }

    /** Nicely formats an unknown error. */
    private static handleError(err: unknown): string {
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
