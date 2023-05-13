export enum ModSortOptions {
    Id,
    /** Will fallback to {@link TotalDownloads} for mods with equal ratings. */
    StarRating,
    TotalViews,
    TotalDownloads,
    TotalFavourites,
    FileSize,
    DateUploaded,
    /** Will fallback to {@link DateUploaded} for mods without any updates. */
    LastUpdated,
    CatalogueLastUpdated,
}
