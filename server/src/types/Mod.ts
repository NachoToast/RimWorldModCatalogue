import { ModAuthor } from './ModAuthor';
import { ModDLCs } from './ModDLCs';
import { ModTags } from './ModTags';

export interface Mod {
    id: string;
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
    posted: string;
    updated: string;
    catalogueLastUpdated: string;
    statsVisitors: number;
    statsSubscribers: number;
    statsFavourites: number;
}
