import { ValuesOf, JSONValue } from '@shared';

/**
 * Shape of exported config that will be used throughout the server.
 *
 * For more info see the schema (`docs/config-schema.json`).
 *
 * For default values, see `src/constants/defaultConfig.ts`.
 */
export interface Config {
    port: number;

    clientUrls: Set<string>;

    numProxies: number;

    maxRequestsPerMinute: number;

    rateLimitBypassTokens: Set<string>;

    /** Required value, process will exit if omitted! */
    mongoURI: string;

    mongoDbName: string;

    updateIntervalHours: number;

    // the following values should not be defined in `config.json` as they are automatically generated
    // if provided, they will be overwritten

    /** Commit hash of current version. */
    commit: string;

    startedAt: string;
}

/**
 * These properties must be transformed by our config loading function, as their type in the {@link Config} interface
 * cannot be represented in JSON ({@link Set Sets}, {@link RegExp RegExps}, etc...).
 */
// there's probably a better way of extracting these keys out, however I haven't found it :P
type KeysThatRequireTransforming = ValuesOf<{ [k in keyof Config]: Config[k] extends JSONValue ? never : k }>;

/**
 * This interface defines the initial JSON-representable type of
 * {@link KeysThatRequireTransforming properties that need transforming}.
 */
export interface ImportedConfig extends Partial<Omit<Config, KeysThatRequireTransforming>> {
    clientUrls?: string[];
    rateLimitBypassTokens?: string[];
}
