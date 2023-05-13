export interface PaginationParams {
    /** Page number, starts at 0. */
    page: number;

    /** Maximum number of results to show per page. */
    perPage: number;
}

export interface WithPagination<T> {
    /** Total number of relevant items across all pages.  */
    totalItemCount: number;

    items: T[];
}
