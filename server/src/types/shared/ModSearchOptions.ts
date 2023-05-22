import { ModDLCs } from './ModDLCs';
import { ModSortOptions } from './ModSortOptions';
import { ModTags } from './ModTags';
import { PaginationParams } from './Page';
import { ModId } from './Utility';

export enum SearchChainOptions {
    And = 0,
    Or = 1,
}

/**
 * Include operations are OR chained.
 *
 * Exclude operations are AND chained, and take priority over include operations.
 *
 * @example
 * ```ts
 * const dlcsInclude: ModDLCs.Royalty | ModDLCs.Biotech;
 * const dlcsExclude: ModDLCs.Biotech;
 * // returns mods that have the Royalty DLC, but not the Biotech DLC.
 * ```
 */
export interface ModSearchOptions extends PaginationParams {
    sortBy: ModSortOptions;
    /** 1 = Ascending, -1 = Descending */
    sortDirection: 1 | -1;
    tagsInclude: ModTags;
    tagsExclude: ModTags;
    tagsIncludeChain: SearchChainOptions;
    dlcsInclude: ModDLCs;
    dlcsExclude: ModDLCs;
    dlcsIncludeChain: SearchChainOptions;
    /**
     * If provided, sort direction will be based on title relevance instead of the provided sort direction.
     *
     * - Case insensitive.
     * - Sort direction will also be ignored.
     */
    search?: string;

    /** Narrows results to only those that have X listed as a dependency. */
    dependantsOf?: ModId;
}
