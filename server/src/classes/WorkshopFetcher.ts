import axios, { AxiosRequestConfig } from 'axios';
import { Mod } from '../types/Mod';
import { ModId } from '../types/Utility';
import { ChunkEmitter, MassRequester } from './MassRequester';
import { WorkshopParser } from './WorkshopParser';

/**
 * Handles fetching of workshop items from the Steam Workshop.
 *
 * The static {@link fetchMod} method can be used to fetch a single workshop item.
 *
 * The basic lifecycle of a fetcher is:
 * 1. Instantiation
 * 2. {@link fetchNumPages Fetching number of pages}.
 * 3. {@link fetchAllPages Fetching all page data}.
 * 4. {@link fetchAllMods Fetching all item data}.
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
    private static readonly _pageUrl: string = 'https://steamcommunity.com/workshop/browse';
    private static readonly _itemUrl: string = 'https://steamcommunity.com/sharedfiles/filedetails';

    /** Requester for making mass network requests to. */
    private readonly _massRequester: MassRequester;

    /** Query parameters to send with network requests. */
    private readonly _params: AxiosRequestConfig['params'];

    /**
     * Creates a new {@link WorkshopFetcher} instance.
     * @param {boolean} loggingEnabled Whether to log mass network requests.
     * @param {number} postedSince Timestamp (in seconds) for start of 'posted date' range filter.
     * @param {number} updatedSince Timestamp (in seconds) for start of 'date last updated' range filter.
     */
    public constructor(loggingEnabled: boolean = false, postedSince: number = 0, updatedSince: number = 0) {
        this._massRequester = new MassRequester(loggingEnabled, 300, 3, 1_000, 100);

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
     */
    public async fetchNumPages(): Promise<number> {
        const { data } = await axios.get<string>(WorkshopFetcher._pageUrl, {
            params: {
                ...this._params,
                p: 1,
            },
        });

        return WorkshopParser.parsePageCount(data);
    }

    /**
     * Fetches the content of each page of mods on the workshop.
     * @param {number} [numPages] The number of pages to fetch. If omitted, all pages will be fetched.
     * @returns {Promise<ChunkEmitter<ModId[]>>} A chunk emitter, each chunk contains an array of pages, which
     * themselves contain an array of mod IDs.
     */
    public async fetchAllPages(numPages?: number): Promise<ChunkEmitter<ModId[]>> {
        numPages ??= await this.fetchNumPages();

        const argsArray = new Array(numPages).fill(0).map((_, i) => i + 1); // page number starts at 1

        return this._massRequester.createChunkEmitter(
            (args) => this.fetchPage(args),
            argsArray,
            (args) => args.toString(),
            [],
        );
    }

    /**
     * Fetches an array of mods.
     * @param {ModId[]} ids Array of mod IDs to fetch the content of.
     * @returns {Promise<ChunkEmitter<Mod | null>>} A chunk emitter, each chunk contains an array of mods.
     */
    public async fetchAllMods(ids?: ModId[]): Promise<ChunkEmitter<Mod | null>> {
        ids ??= (await MassRequester.collectAllFromEmitter(await this.fetchAllPages())).flat();

        const argsArray = new Array(ids.length).fill(0).map((_, i) => ids![i]);

        return this._massRequester.createChunkEmitter(
            (args) => WorkshopFetcher.fetchMod(args),
            argsArray,
            (args) => args,
            null,
        );
    }

    /**
     * Fetches a single page of mods.
     * @param {number} pageNumber The page number, starts at 1.
     * @returns {Promise<ModId[]>} The mod IDs on the page.
     *
     * This is not a static method as page contents are dependent on the instance's {@link _params}.
     */
    private async fetchPage(pageNumber: number): Promise<ModId[]> {
        const { data } = await axios.get<string>(WorkshopFetcher._pageUrl, {
            params: {
                ...this._params,
                p: pageNumber,
            },
        });

        return WorkshopParser.parsePageMods(data);
    }

    /** Fetches a single workshop item. */
    public static async fetchMod(id: ModId): Promise<Mod | null> {
        const { data } = await axios.get<string>(WorkshopFetcher._itemUrl, {
            params: {
                id,
            },
        });

        const parser = new WorkshopParser(data);

        if (parser.getIsInaccessible()) return null;

        const mod: Mod = {
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
            catalogueLastUpdated: new Date().toISOString(),
            statsVisitors: parser.getVisitors(),
            statsSubscribers: parser.getSubscribers(),
            statsFavourites: parser.getFavourites(),
        };

        const updated = parser.getUpdated();
        if (updated !== undefined) mod.updated = updated;

        return mod;
    }
}
