import { execSync } from 'child_process';
import { Config } from '../types/Config';

/** Default config values, keep this in sync with `docs/config-schema.json`. */
export const defaultConfig: Omit<Config, 'mongoURI'> = {
    port: 5000,

    clientUrls: new Set(['*']),

    numProxies: 0,

    maxRequestsPerMinute: 30,

    rateLimitBypassTokens: new Set(),

    mongoDbName: 'rimworld_mod_catalogue_default',

    commit: execSync('git rev-parse HEAD').toString().trim(),

    startedAt: new Date().toISOString(),
};
