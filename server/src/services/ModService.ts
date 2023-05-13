/*
ModService:

This services handles all interactions with the mods database, such as:

- Upserting mods.
- Getting the total number of mods.
- Searching mods.
*/

import { AnyBulkWriteOperation, Collection, Condition, Db, Filter, FindOptions, Sort } from 'mongodb';
import { Mod } from '../types/Mod';
import { ModDLCs } from '../types/ModDLCs';
import { ModSearchOptions } from '../types/ModSearchOptions';
import { ModSortOptions } from '../types/ModSortOptions';
import { ModTags } from '../types/ModTags';
import { WithPagination } from '../types/Page';

let model: Collection<Mod> | null = null;

export async function initializeModService(mongoDb: Db): Promise<void> {
    model = mongoDb.collection('mods');
    await model.createIndex({ title: 'text' });
}

function getModel(): Collection<Mod> {
    if (model === null) throw new Error('ModService called before being initialized!');
    return model;
}

export async function getTotalModCount(): Promise<number> {
    return await getModel().estimatedDocumentCount();
}

export async function upsert(mods: Mod[]): Promise<void> {
    if (mods.length === 0) return;

    const bulkUpdateOperations = mods.map<AnyBulkWriteOperation<Mod>>((mod) => ({
        updateOne: {
            filter: { _id: mod._id },
            update: { $set: mod },
            upsert: true,
        },
    }));

    await getModel().bulkWrite(bulkUpdateOperations);
}

export async function searchMods(searchOptions: ModSearchOptions): Promise<WithPagination<Mod>> {
    const { page, perPage, sortBy, sortDirection, tagsInclude, tagsExclude, dlcsInclude, dlcsExclude, search } =
        searchOptions;

    const dlcFilter: Condition<ModDLCs> = { $bitsAllClear: dlcsExclude };
    if (dlcsInclude) dlcFilter.$bitsAnySet = dlcsInclude;

    const tagFilter: Condition<ModTags> = { $bitsAllClear: tagsExclude };
    if (tagsInclude) tagFilter.$bitsAnySet = tagsInclude;

    const filter: Filter<Mod> = { dlcs: dlcFilter, tags: tagFilter };
    const options: FindOptions<Mod> = { limit: perPage, skip: page * perPage };
    const sort: Sort = {};

    if (search !== undefined) {
        filter.$text = { $search: search };
        sort.score = { $meta: 'textScore' };
    }

    switch (sortBy) {
        case ModSortOptions.Id:
            sort._id = sortDirection;
            break;
        case ModSortOptions.StarRating:
            sort.ratingStars = sortDirection;
            sort.statsSubscribers = sortDirection;
            break;
        case ModSortOptions.TotalViews:
            sort.statsVisitors = sortDirection;
            break;
        case ModSortOptions.TotalDownloads:
            sort.statsSubscribers = sortDirection;
            break;
        case ModSortOptions.TotalFavourites:
            sort.statsFavourites = sortDirection;
            break;
        case ModSortOptions.FileSize:
            sort.size = sortDirection;
            break;
        case ModSortOptions.DateUploaded:
            sort.posted = sortDirection;
            break;
        case ModSortOptions.LastUpdated:
            sort.updated = sortDirection;
            sort.posted = sortDirection;
            break;
        case ModSortOptions.CatalogueLastUpdated:
            sort.catalogueLastUpdated = sortDirection;
            break;
    }

    if (sortBy !== ModSortOptions.Id) sort._id = 1;

    const [totalItemCount, items] = await Promise.all([
        getModel().countDocuments(filter),
        getModel().find(filter, options).sort(sort).toArray(),
    ]);

    return { totalItemCount, items };
}
