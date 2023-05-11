import axios, { AxiosRequestConfig } from 'axios';
import { Colours } from '../types/Colours';
import { Mod } from '../types/Mod';
import { PageResponse } from '../types/PageResponse';
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
 * const fetcher = new WorkshopFetcher();
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
 * const initialPageData = await fetcher.fetchNumPages();
 *
 * console.log(`[1/3] Fetching mod IDs from ${initialPageData.pageCount} Pages...`);
 * const modIds = await fetcher.fetchAllPages(initialPageData);
 *
 * console.log(`[2/3] Fetching data for ${modIds.length} mods...`);
 * const allMods = await fetcher.fetchAllItems(modIds);
 *
 * console.log(`[3/3] Done! Fetched ${allMods.length} mods`);
 * ```
 */
export class WorkshopFetcher {
    /**
     * Maximum number of times to attempt certain network requests.
     *
     * Used in {@link fetchAllPages} and {@link fetchAllItems}.
     */
    private static readonly _maxAttempts: number = 3;

    /** Maximum number of parallel requests, used in {@link fetchAllItems}. */
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

    /** Default query parameters. */
    private static readonly _baseFetchParams: AxiosRequestConfig['params'] = {
        appid: 294100,
        browsesort: 'trend',
        section: 'readytouseitems',
        'requiredtags[0]': 'Mod',
        'requiredtags[1]': '1.4',
        created_date_range_filter_start: 0,
        created_date_range_filter_end: 0,
        updated_date_range_filter_start: 0,
        updated_date_range_filter_end: 0,
        actualsort: 'trend',
        days: -1,
    };

    /** Whether to log mass network requests using a {@link ProgressLogger}. */
    private readonly _verbose: boolean;

    public constructor(verbose: boolean) {
        this._verbose = verbose;
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
        const { data } = await axios.get<string>('https://steamcommunity.com/workshop/browse', {
            params: {
                ...WorkshopFetcher._baseFetchParams,
                p: 1,
            },
        });

        return WorkshopParser.parsePage(data, true);
    }

    /**
     * Fetches the content of each page of mods on the workshop.
     * @param {PageResponse} pageResponse The response from {@link fetchNumPages}, this is required as it contains the
     * number of pages needed to be fetched, as well as the IDs of all the mods on the first page.
     * @returns {Promise<string[]>} The mod IDs from all pages, this is required to call {@link fetchAllItems}.
     */
    public async fetchAllPages(pageResponse: PageResponse): Promise<string[]> {
        const { pageCount, ids } = pageResponse;

        const logger = this._verbose
            ? new ProgressLogger(pageCount, [`${Colours.FgGreen}x${Colours.Reset}`])
            : undefined;

        const promiseArray = new Array<Promise<string[]>>(pageCount);
        promiseArray[0] = Promise.resolve(ids);

        const erroredPages: [string, string][] = [];

        for (let i = 1; i < pageCount; i++) {
            promiseArray[i] = new Promise<string[]>((resolve) => {
                WorkshopFetcher.multiAttempt(WorkshopFetcher.fetchPageItems, i + 1, (msg) => logger?.log(i, msg))
                    .then(resolve)
                    .catch((err) => {
                        erroredPages.push([(i + 1).toString(), WorkshopFetcher.handleError(err)]);
                        resolve([]);
                    });
            });
        }

        const fetchedData = await Promise.all(promiseArray);

        logger?.close();

        ProgressLogger.logErrors(erroredPages, 'pages');

        return fetchedData.flat();
    }

    /**
     * Fetches the content of each mod on the workshop.
     * @param {string[]} ids The mod IDs from all pages, this is returned from {@link fetchAllPages}.
     * @returns {Promise<Mod[]>} The content of each mod on the workshop.
     */
    public async fetchAllItems(ids: string[]): Promise<Mod[]> {
        const modCount = ids.length;
        const chunkCount = Math.ceil(modCount / WorkshopFetcher._chunkSize);

        const outputMods: Mod[] = [];

        const erroredMods: [string, string][] = [];

        for (let chunk = 0; chunk < chunkCount; chunk++) {
            const chunkIds = ids.slice(chunk * WorkshopFetcher._chunkSize, (chunk + 1) * WorkshopFetcher._chunkSize);
            const numIds = chunkIds.length;

            if (this._verbose) {
                console.log(
                    `Fetching chunk ${(chunk + 1)
                        .toString()
                        .padStart(chunkCount.toString().length, ' ')}/${chunkCount}`,
                );
            }

            const logger = this._verbose ? new ProgressLogger(numIds) : undefined;

            const promiseArray = new Array<Promise<Mod | null>>(numIds);

            for (let i = 0; i < numIds; i++) {
                const id = chunkIds[i];
                promiseArray[i] = new Promise<Mod | null>((resolve) => {
                    WorkshopFetcher.multiAttempt(WorkshopFetcher.fetchSingleItem, ids[i], (msg) => logger?.log(i, msg))
                        .then(resolve)
                        .catch((err) => {
                            erroredMods.push([id, WorkshopFetcher.handleError(err)]);
                            resolve(null);
                        });
                });
            }

            const fetchedData = await Promise.all(promiseArray);

            logger?.close();

            outputMods.push(...fetchedData.filter((e): e is Mod => e !== null));
        }

        ProgressLogger.logErrors(erroredMods, 'mods');

        return outputMods;
    }

    /**
     * Attempts to successfully run an asynchronous function mutliple times.
     * @param {(args: TArgs) => Promise<TReturn>} fn The asynchronous function to run.
     * @param {TArgs} args Arguments to pass into the function.
     * @param {(msg: string) => void} [logFn] A function to log messages to.
     * @returns The successful return value of the function.
     * @throws Throws an error if the function fails after the maximum number of attempts.
     *
     * This is used by {@link fetchAllItems} and {@link fetchAllPages}.
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
                if (numAttempts === WorkshopFetcher._maxAttempts - 1) {
                    logFn?.(`${Colours.FgRed}e${Colours.Reset}`);
                    latestError = error;
                } else {
                    logFn?.(`${Colours.FgYellow}e${Colours.Reset}`);
                }

                numAttempts++;
                await new Promise((resolve) =>
                    setTimeout(resolve, WorkshopFetcher._retryCooldownMultiplier * numAttempts),
                );
            }
        }

        throw latestError;
    }

    /**
     * Internal helper method used by {@link fetchAllPages} to fetch an individual page.
     * @param {number} pageNumber The page number
     * @returns {Promise<string[]>} The mod IDs on the page.
     *
     * The page number should start at 2, since the first page is fetched by {@link fetchNumPages}.
     */
    private static async fetchPageItems(pageNumber: number): Promise<string[]> {
        const { data } = await axios.get<string>('https://steamcommunity.com/workshop/browse', {
            params: {
                ...WorkshopFetcher._baseFetchParams,
                p: pageNumber,
            },
        });

        return WorkshopParser.parsePage(data);
    }

    /**
     * Fetches a single workshop item.
     * @param {String} id The ID of the workshop item.
     * @returns {Promise<Mod>} A {@link Mod} object.
     * @throws May throw an error if something goes wrong while fetching the item.
     *
     * Used internally by {@link fetchAllItems}.
     */
    public static async fetchSingleItem(id: string): Promise<Mod> {
        const { data } = await axios.get<string>('https://steamcommunity.com/sharedfiles/filedetails', {
            params: {
                id,
            },
        });

        const parser = new WorkshopParser(data);

        return {
            id,
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
