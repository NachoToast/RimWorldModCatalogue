export type ValuesOf<T> = T[keyof T];

/**
 * A string in ISO format, used to store dates.
 *
 * {@link https://en.wikipedia.org/wiki/ISO_8601}
 *
 * @example '2022-11-08T02:20:08.190Z'
 */
export type ISOString = string;

/** The shape of a parsed JSON object. */
export type JSONValue = string | number | boolean | null | { [x: string]: JSONValue } | Array<JSONValue>;
