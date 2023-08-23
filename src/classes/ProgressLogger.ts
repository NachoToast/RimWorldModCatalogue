/**
 * Handles routine logging of progress to `process.stdout`.
 *
 * Progress is represented as an array of strings, where each string represents the status of a task.
 *
 * The basic lifecycle of a logger is:
 * 1. Instantiation
 * 2. {@link log Logging}
 * 3. {@link close Closing}
 */
export class ProgressLogger {
    /** Time between log messages, in seconds. */
    private static readonly _loggingInterval: number = 250;

    /** Maximum character width of the terminal. */
    private readonly _maxWidth: number;

    /** Title string to lead log messages with. */
    private readonly _title: string;

    /** Output to log every interval, each item in this array should represent an asynchronous task. */
    private readonly _output: string[];

    /** Number of rows to log, this is recorded so that the correct number of rows is cleared. */
    private readonly _rows: number;

    /** Internal interval tracker, referenced for cleanup. */
    private _interval: NodeJS.Timeout;

    /** Whether to actually write to the console, prevents writes when the output is unchanged. */
    private _dirty = false;

    /**
     * Creates a new {@link ProgressLogger} instance.
     * @param {string} title Title string to lead log messages with.
     * @param {number} numItems The number of tasks to track.
     */
    public constructor(title: string, numItems: number) {
        try {
            this._maxWidth = process.stdout.getWindowSize()[0];
        } catch (error) {
            // some environments don't seem to have a process.stdout, such as pm2
            this._maxWidth = -1;
        }

        this._title = title;
        this._output = new Array(numItems).fill('-');
        this._rows = Math.ceil(numItems / this._maxWidth);

        this._interval = setInterval(() => {
            if (this._dirty) {
                this._dirty = false;
                this.clear();
                this.update();
            }
        }, ProgressLogger._loggingInterval);

        this.update();
    }

    /**
     * Updates the status of a tracked asynchronous task.
     * @param {number} index The index of the task to update.
     * @param {string} status New status to show this index as.
     */
    public log(index: number, status: string): void {
        this._output[index] = status;
        this._dirty = true;
    }

    /** Clears the previous output (if supported). */
    private clear(): void {
        if (this._maxWidth === -1) return;

        for (let i = 0; i <= this._rows; i++) {
            process.stdout.clearLine(0);
            process.stdout.moveCursor(0, -1);
        }
    }

    /** Logs all task statuses to the console. */
    private update(): void {
        console.log(this._title);
        console.log(this._output.join(''));
    }

    /** Marks logging as finished. */
    public close(): void {
        clearInterval(this._interval);
        this.clear();
    }
}
