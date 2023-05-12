import { Colours } from '../types/Colours';
import { FetchError } from '../types/FetchError';

/**
 * Handles routine logging of progress of multiple asynchronous tasks to `process.stdout`.
 *
 * The static {@link logErrors} method can be used to log errors in a nice format.
 *
 * The basic lifecycle of a logger is:
 * 1. Instantiation
 * 2. {@link log Logging}
 * 3. {@link close Closing}
 * 4. (Optional) {@link logErrors Logging Errors}
 */
export class ProgressLogger {
    /** Time between log messages, in seconds. */
    private static readonly _loggingInterval: number = 250;

    /** Maximum character width of the terminal. */
    private readonly _maxWidth: number;

    /** Output to log every interval, each item in this array should represent an asynchronous task. */
    private readonly _output: string[];

    /** Number of rows to log, this is recorded so that the correct number of rows is cleared. */
    private readonly _rows: number;

    /** Internal interval tracker, referenced for cleanup. */
    private _interval: NodeJS.Timer;

    /**
     * Creates a new {@link ProgressLogger} instance.
     * @param {number} numItems The number of tasks to track.
     */
    public constructor(numItems: number) {
        try {
            this._maxWidth = process.stdout.getWindowSize()[0];
        } catch (error) {
            // some environments don't seem to have a process.stdout, such as pm2
            this._maxWidth = -1;
        }

        this._output = new Array<string>(numItems).fill('-');
        this._rows = Math.ceil(numItems / this._maxWidth);
        this._interval = setInterval(() => this.update(true), ProgressLogger._loggingInterval);

        this.update(false);
    }

    /**
     * Updates the status of a tracked asynchronous task.
     * @param {number} index The index of the task to update.
     * @param {string} value New status value to log.
     */
    public log(index: number, value: string): void {
        this._output[index] = value;
    }

    /** Logs all task statuses to `process.stdout`, clearing the previous output (if supported). */
    private update(replace: boolean): void {
        if (replace && this._maxWidth !== -1) {
            for (let i = 0; i < this._rows; i++) {
                process.stdout.clearLine(0);
                process.stdout.moveCursor(0, -1);
            }
        }
        console.log(this._output.join(''));
    }

    /** Marks logging as finished. */
    public close(): void {
        clearInterval(this._interval);
        this.update(true);
    }

    /**
     * Logs an array of errors in a nice format.
     * @param {FetchError[]} errorArray Array of error tuples, where the first item is the key and the second is
     * the error message.
     * @param {string} title Title of the error log.
     */
    public static logErrors(errorArray: FetchError[], title: string): void {
        if (errorArray.length === 0) return;

        console.log(`${Colours.FgRed}${errorArray.length} Errored ${title}:${Colours.Reset}`);

        const maxKeyLength = Math.max(...errorArray.map((e) => e.key.length));
        const maxTotalLength = Math.max(...errorArray.map((e) => e.message.length)) + maxKeyLength + 10;

        const errorsPerLine = Math.floor(process.stdout.getWindowSize()[0] / maxTotalLength);

        for (let i = 0, len = errorArray.length; i < len; i += errorsPerLine) {
            console.log(
                errorArray
                    .slice(i, i + errorsPerLine)
                    .map((e) => `${e.key.padStart(maxKeyLength, ' ')}: ${e.message}`.padEnd(maxTotalLength, ' '))
                    .join('|'),
            );
        }
    }
}
