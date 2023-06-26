import axios, { AxiosRequestConfig } from 'axios';
import { Mod } from '../types/shared/Mod';
import { ModId } from '../types/shared/Utility';
import { ChunkEmitter, MassRequester } from './MassRequester';
import { WorkshopParser } from './WorkshopParser';

/**
 * Handles fetching of mods (and pages of mods) from the Steam Workshop.
 *
 * The static {@link fetchMod} method can be used to fetch a single workshop item.
 *
 * The basic lifecycle of a fetcher is:
 * 1. Instantiation
 * 2. {@link fetchNumPages Fetching number of pages}
 * 3. {@link fetchAllPages Fetching all page data}
 * 4. {@link fetchAllMods Fetching all item data}
 *
 * @example
 * ```ts
// fetching all mods
const fetcher = new WorkshopFetcher();
const modEmitter = await fetcher.fetchAllMods();
modEmitter.on('chunk', (mods) => {
    console.log(`Fetched ${mods.length} mods!`)
});
modEmitter.on('done', (errors) => {
    console.log('Finished fetching mods');
    console.log(errors);
})
 * ```
 *
 * @example
 * ```ts
// if you want more control over each step of the fetch process
const fetcher = new WorkshopFetcher(true);

console.log('[1/5] Fetching number of pages...');
const pageCount = await fetcher.fetchNumPages();

console.log(`[2/5] Fetching mod IDs from ${pageCount} pages...`);
const pageEmitter = await fetcher.fetchAllPages(pageCount);

let pagesReceived = 0;
const modIds: string[] = [];

pageEmitter.on('chunk', (pageChunk) => {
    pagesReceived += pageChunk.length;
    modIds.push(...pageChunk.flat());
});

await new Promise<void>((resolve) => {
    pageEmitter.on('done', (errors) => {
        MassRequester.logErrors(errors, 'pages');
        resolve();
    });
});

console.log(`[3/5] Fetching mod data for ${modIds.length} mod IDs across ${pagesReceived} pages...`);

let modsSkipped = 0;

const modEmitter = await fetcher.fetchAllMods(modIds.flat());

modEmitter.on('chunk', (modChunk) => {
    const trueModChunk = modChunk.filter((mod): mod is Mod => mod !== null);
    // do something with the mods here
    modsSkipped += modChunk.length - trueModChunk.length;
});

modEmitter.on('done', (errors) => {
    console.log(`Done, ${modsSkipped} mods were skipped`)
    MassRequester.logErrors(errors, 'mods');
});
 * ```
 */
export class WorkshopFetcher {
    private static readonly _pageUrl: string = 'https://steamcommunity.com/workshop/browse';
    private static readonly _itemUrl: string = 'https://steamcommunity.com/sharedfiles/filedetails';

    /** Requester for making mass network requests with. */
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
        // manually fetch the number of pages if 'numPages' isn't passed in
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
     *
     * A mod can be `null` if it is not publically visible (e.g. due to to explicit content tags).
     */
    public async fetchAllMods(ids?: ModId[]): Promise<ChunkEmitter<Mod | null>> {
        // manually fetch all ids from all pages if 'ids' isn't passed in
        // this does have the downside of requiring the usage of 'collectAllFromEmitter', which is not good for
        // keeping memory usage constrained, but the alternative is nesting chunk emitters
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
     * This is not a static method as the page changes based on {@link _params search parameters}.
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

    /**
     * Fetches a single workshop item.
     *
     * May return `null` for mods that are not publically visible (e.g. due to explicit content tags).
     */
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
            dependencyIds: parser.getDependencyIds(),
            dependencyNames: parser.getDependencyNames(),
        };

        const updated = parser.getUpdated();
        if (updated !== undefined) mod.updated = updated;

        return mod;
    }
}
