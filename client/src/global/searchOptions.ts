import { ModDLCs } from '../types/shared/ModDLCs';
import { SearchChainOptions, ModSearchOptions } from '../types/shared/ModSearchOptions';
import { ModSortOptions } from '../types/shared/ModSortOptions';
import { ModTags } from '../types/shared/ModTags';

const KEY = 'rimworld-mod-catalogue.search';

const defaultSearchOptions: ModSearchOptions = {
    page: 0,
    perPage: 30,
    sortBy: ModSortOptions.Id,
    sortDirection: 1,
    tagsInclude: ModTags.None,
    tagsExclude: ModTags.None,
    tagsIncludeChain: SearchChainOptions.Or,
    dlcsInclude: ModDLCs.None,
    dlcsExclude: ModDLCs.None,
    dlcsIncludeChain: SearchChainOptions.Or,
};

export function loadSearchOptions(): ModSearchOptions {
    const existingSearch = sessionStorage.getItem(KEY);

    if (existingSearch !== null) {
        return {
            ...defaultSearchOptions,
            ...JSON.parse(existingSearch),
        };
    }

    return { ...defaultSearchOptions };
}

export function saveSearchOptions(search: ModSearchOptions): void {
    const output = { ...search };
    sessionStorage.setItem(KEY, JSON.stringify(output));
}
