/** Generic error class that can be caught by middleware. */
export abstract class SiteError<T = undefined> extends Error {
    public abstract readonly statusCode: number;

    public readonly title: Capitalize<string>;

    public readonly description: string;

    public readonly additionalData: T;

    /**
     * @param {string} title The error described in a few words (e.g. `Failed to Fetch User`).
     * @param {string} description A sentence that explains how the error occurred (e.g. `A user with this ID does not
     * exist in the database.`).
     * @param {T} additionalData Additional context to show the user.
     */
    public constructor(title: Capitalize<string>, description: string, additionalData: T) {
        super();
        this.title = title;
        this.description = description;
        this.additionalData = additionalData;
    }
}

/** Representation of a {@link SiteError} in JSON. */
export interface SiteErrorObject<T = undefined> {
    title: Capitalize<string>;
    description: string;
    additionalData: T;
}
