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
import { ModSearchOptions, SearchChainOptions } from '../types/ModSearchOptions';
import { ModSortOptions } from '../types/ModSortOptions';
import { ModTags } from '../types/ModTags';
import { WithPagination } from '../types/Page';
import { ModId } from '../types/Utility';

let model: Collection<Mod> | null = null;

function getModel(): Collection<Mod> {
    if (model === null) throw new Error('ModService called before being initialized!');
    return model;
}

export async function initializeModService(mongoDb: Db): Promise<void> {
    model = mongoDb.collection('mods');
    await model.createIndex({ title: 'text' });
}

export async function getTotalModCount(): Promise<number> {
    return await getModel().estimatedDocumentCount();
}

export async function deleteMod(id: ModId): Promise<void> {
    await getModel().deleteOne({ _id: id });
}

export async function upsertMods(mods: Mod[]): Promise<[inserted: number, updated: number]> {
    if (mods.length === 0) return [0, 0];

    const bulkUpdateOperations = mods.map<AnyBulkWriteOperation<Mod>>((mod) => ({
        updateOne: {
            filter: { _id: mod._id },
            update: { $set: mod },
            upsert: true,
        },
    }));

    const bulkWriteResult = await getModel().bulkWrite(bulkUpdateOperations);

    return [bulkWriteResult.upsertedCount, bulkWriteResult.modifiedCount];
}

export async function getMod(id: ModId): Promise<Mod | null> {
    return await getModel().findOne({ _id: id });
}

export async function searchMods(searchOptions?: Partial<ModSearchOptions>): Promise<WithPagination<Mod>> {
    const page = searchOptions?.page ?? 0;
    const perPage = searchOptions?.perPage ?? 20;
    const sortBy = searchOptions?.sortBy ?? ModSortOptions.Id;
    const sortDirection = searchOptions?.sortDirection ?? 1;
    const tagsInclude = searchOptions?.tagsInclude ?? ModTags.None;
    const tagsExclude = searchOptions?.tagsExclude ?? ModTags.None;
    const tagsIncludeChain = searchOptions?.tagsIncludeChain ?? SearchChainOptions.And;
    const dlcsInclude = searchOptions?.dlcsInclude ?? ModDLCs.None;
    const dlcsExclude = searchOptions?.dlcsExclude ?? ModDLCs.None;
    const dlcsIncludeChain = searchOptions?.dlcsIncludeChain ?? SearchChainOptions.And;
    const search = searchOptions?.search;
    const dependantsOf = searchOptions?.dependantsOf;

    const dlcFilter: Condition<ModDLCs> = { $bitsAllClear: dlcsExclude };
    if (dlcsInclude !== ModDLCs.None) {
        if (dlcsIncludeChain === SearchChainOptions.And) {
            dlcFilter.$bitsAllSet = dlcsInclude;
        } else {
            dlcFilter.$bitsAnySet = dlcsInclude;
        }
    }

    const tagFilter: Condition<ModTags> = { $bitsAllClear: tagsExclude };
    if (tagsInclude) {
        if (tagsIncludeChain === SearchChainOptions.And) {
            tagFilter.$bitsAllSet = tagsInclude;
        } else {
            tagFilter.$bitsAnySet = tagsInclude;
        }
    }

    const filter: Filter<Mod> = { dlcs: dlcFilter, tags: tagFilter };
    const options: FindOptions<Mod> = { limit: perPage, skip: page * perPage };
    const sort: Sort = {};

    if (search !== undefined) {
        filter.$text = { $search: search };
        sort.score = { $meta: 'textScore' };
    }

    if (dependantsOf !== undefined) {
        filter.dependencyIds = { $elemMatch: { $eq: dependantsOf } };
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

    if (sortBy !== ModSortOptions.Id) sort._id = 1; // always do final sort by ID

    const [totalItemCount, items] = await Promise.all([
        getModel().countDocuments(filter),
        getModel().find(filter, options).sort(sort).toArray(),
    ]);

    return { totalItemCount, items };
}
