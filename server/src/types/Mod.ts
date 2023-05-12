import { ModAuthor } from './ModAuthor';
import { ModDLCs } from './ModDLCs';
import { ModTags } from './ModTags';
import { ISOString, ModId } from './Utility';

export interface Mod {
    _id: ModId;
    thumbnail: string;
    title: string;
    description: string;
    ratingStars: number;
    ratingCount: number;
    authors: ModAuthor[];
    tags: ModTags;
    dlcs: ModDLCs;
    /** Size in Megabytes. */
    size: number;
    posted: ISOString;
    updated?: ISOString;
    /** When this mod was last updated in our database. */
    catalogueLastUpdated: ISOString;
    statsVisitors: number;
    statsSubscribers: number;
    statsFavourites: number;
}
