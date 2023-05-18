import { parse, HTMLElement } from 'node-html-parser';
import { KNOWN_DLCS } from '../constants/dlcs';
import { TAG_KEYWORDS } from '../constants/tags';
import { ModAuthor } from '../types/shared/ModAuthor';
import { ModDLCs } from '../types/shared/ModDLCs';
import { ModTags } from '../types/shared/ModTags';
import { ModId } from '../types/shared/Utility';

/**
 * Handles HTML parsing of workshop items into properties of the {@link Mod} object.
 *
 * The static {@link parsePageMods} method can be used to parse a page of workshop items.
 */
export class WorkshopParser {
    /** Contains the entire HTML DOM. */
    private readonly _root: HTMLElement;

    /** Contains the DOM section related to the star rating. */
    private readonly _ratingSection: HTMLElement | null;

    /** Contains the div elements related to the file size and posted/updated times. */
    private readonly _detailsElements: HTMLElement[] | undefined;

    /** Contains the table data elements related to the visitors, subscribers, and favourites statistics. */
    private readonly _statsElements: HTMLElement[] | undefined;

    /** Contains the anchor elements related to mod dependencies. */
    private readonly _dependencyElements: HTMLElement[] | undefined;

    public constructor(rawData: string) {
        this._root = parse(rawData);
        this._ratingSection = this._root.querySelector('.ratingSection');
        this._detailsElements = this._root.querySelectorAll('.detailsStatRight');
        this._statsElements = this._root.querySelector('.stats_table')?.querySelectorAll('td');
        this._dependencyElements = this._root.querySelector('#RequiredItems')?.querySelectorAll('a');
    }

    /**
     * Some mods require the client to be logged in to view, such as those with explicit content tags.
     *
     * E.g. https://steamcommunity.com/sharedfiles/filedetails/?id=2911258858
     */
    public getIsInaccessible(): boolean {
        return this._root.querySelector('#message') !== null;
    }

    public getThumbnail(): string {
        return (
            this._root.querySelector('#previewImageMain')?.getAttribute('src') ??
            this._root.querySelector('#previewImage')?.getAttribute('src') ??
            ''
        );
    }

    public getTitle(): string {
        return this._root.querySelector('.workshopItemTitle')?.innerText ?? 'No Title';
    }

    public getDescription(): string {
        return this._root.querySelector('.workshopItemDescription')?.innerHTML ?? 'No description.';
    }

    public getRatingStars(): number {
        /*
        star rating is identified by the img 'src' attribute, e.g.:
        - 5 stars https://community.akamai.steamstatic.com/public/images/sharedfiles/5-star_large.png?v=2
        - 4 stars https://community.akamai.steamstatic.com/public/images/sharedfiles/4-star_large.png?v=2 
        - 3 stars https://community.akamai.steamstatic.com/public/images/sharedfiles/3-star_large.png?v=2
        - unknown stars https://community.akamai.steamstatic.com/public/images/sharedfiles/not-yet_large.png?v=2 
        */
        const ratingStarsString = this._ratingSection?.querySelector('img')?.getAttribute('src') ?? '';
        // extract star count via capture group in RegExp (ty @pumbas600)
        return parseInt(/([0-5])-star/i.exec(ratingStarsString)?.at(1) ?? '0');
    }

    public getRatingCount(): number {
        const ratingCountString = this._ratingSection
            ?.querySelector('.numRatings')
            ?.innerText.replaceAll(',', '')
            .split(/\s/) // split on the space (e.g. "11335 ratings" -> ["11335", "ratings"])
            .at(0);
        return parseInt(ratingCountString ?? '0');
    }

    public getAuthors(): ModAuthor[] {
        return this._root.querySelectorAll('.friendBlock.persona').map((e) => ({
            url: e.querySelector('.friendBlockLinkOverlay')?.getAttribute('href') ?? '',
            name:
                e
                    .querySelector('.friendBlockContent')
                    ?.innerText.trim()
                    .replaceAll(/\s+.*$/g, '') ?? '', // remove everything after the first whitespace
            avatar: e.querySelector('.playerAvatar')?.querySelector('img')?.getAttribute('src') ?? '',
        }));
    }

    public getTags(): ModTags {
        let output = ModTags.None;

        const description = new Set(
            this._root.querySelector('.workshopItemDescription')?.innerText?.toLowerCase().split(/\W/g),
        );

        if (description.size === 0) return output;

        loop1: for (const [tag, keywords] of TAG_KEYWORDS) {
            for (const keyword of keywords) {
                if (description.has(keyword) || description.has(`${keyword}s`)) {
                    output |= tag;
                    continue loop1;
                }
            }
        }

        return output;
    }

    public getDlcs(): ModDLCs {
        let output = ModDLCs.None;

        for (const element of this._root.querySelectorAll('.requiredDLCName')) {
            const text = element.querySelector('a')?.innerText?.toLowerCase();
            if (text === undefined) continue;
            for (const [dlc, flag] of KNOWN_DLCS) {
                if (text.includes(flag)) output |= dlc;
            }
        }

        return output;
    }

    public getSize(): number {
        return parseFloat(this._detailsElements?.at(0)?.innerText.replaceAll(',', '').split(/\s/).at(0) ?? '0');
    }

    public getPosted(): string {
        return WorkshopParser._parseDateString(this._detailsElements?.at(1)?.innerText ?? '').toISOString();
    }

    public getUpdated(): string | undefined {
        const updatedElement = this._detailsElements?.at(2);
        if (updatedElement === undefined) return undefined;
        return WorkshopParser._parseDateString(updatedElement.innerText).toISOString();
    }

    public getVisitors(): number {
        return parseInt(this._statsElements?.at(0)?.innerText.replaceAll(',', '') ?? '0');
    }

    public getSubscribers(): number {
        return parseInt(this._statsElements?.at(2)?.innerText.replaceAll(',', '') ?? '0');
    }

    public getFavourites(): number {
        return parseInt(this._statsElements?.at(4)?.innerText.replaceAll(',', '') ?? '0');
    }

    public getDependencyIds(): ModId[] {
        if (this._dependencyElements === undefined) return [];

        const output = [];

        for (const element of this._dependencyElements) {
            const href = element.getAttribute('href');
            if (href === undefined) continue;
            const url = new URL(href);
            const id = url.searchParams.get('id');
            if (id === null) continue;
            output.push(id);
        }

        return output;
    }

    public getDependencyNames(): string[] {
        return this._dependencyElements?.map((e) => e.innerText.trim()) ?? [];
    }

    /**
     * Converts a string like "16 Apr @ 11:10pm" or "19 Jul, 2016 @ 12:05am" to a Date object.
     * @param {string} dateString The string to convert.
     * @returns {Date} The converted Date object.
     *
     * To avoid unnecessary complexity, the time of the date is not preserved.
     *
     * If you would like to preserve the time in this conversion, feel free to make a PR.
     */
    private static _parseDateString(dateString: string): Date {
        const data = dateString.replaceAll(/@.*$/g, '').split(/\s/);

        const day = data[0];
        const month = data[1].replaceAll(',', '');
        const year = data[2] || new Date().getFullYear().toString();

        return new Date(`${day} ${month} ${year}`);
    }

    /**
     * Gets the contained item IDs from a page.
     * @param {string} rawData The raw HTML data of the page.
     */
    public static parsePageMods(rawData: string): ModId[] {
        const root = parse(rawData);

        const ids = root
            .querySelectorAll('.workshopItem')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map<ModId>((e) => (e.childNodes[1] as any).attributes['data-publishedfileid']);

        return ids;
    }

    /**
     * Gets the page count from a page.
     * @param {stirng} rawData The raw HTML data of the page.
     */
    public static parsePageCount(rawData: string): number {
        const root = parse(rawData);

        const pageElements = root.querySelectorAll('.pagelink');

        if (pageElements.length === 0) return 0;

        return parseInt(pageElements[pageElements.length - 1].innerText.replace(',', ''));
    }
}
