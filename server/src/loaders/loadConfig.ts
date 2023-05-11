import { defaultConfig } from '../constants/defaultConfig';
import { Colours } from '../types/Colours';
import { Config, ImportedConfig } from '../types/Config';

/**
 * Imports and transforms values from `config.json`, using the {@link defaultConfig default config} values as a
 * fallback for any missing non-required values.
 *
 * Exits the process if the `mongoURI` is missing.
 */
export function loadConfig(): Config {
    /** Config that we will take values from when forming the final globally-used {@link Config} object. */
    // we use `readFileSync` since it is easier to mock than `require()`
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const importedConfig: ImportedConfig = require('../../config.json');

    if (importedConfig.mongoURI === undefined) {
        console.log(
            `${Colours.FgRed}mongoURI${Colours.Reset} is missing from ${Colours.FgMagenta}config.json${Colours.Reset}`,
        );
        process.exit();
    }

    return {
        ...defaultConfig,
        ...importedConfig,
        mongoURI: importedConfig.mongoURI,
        clientUrls: importedConfig.clientUrls ? new Set(importedConfig.clientUrls) : defaultConfig.clientUrls,
        rateLimitBypassTokens: importedConfig.rateLimitBypassTokens
            ? new Set(importedConfig.rateLimitBypassTokens)
            : defaultConfig.rateLimitBypassTokens,
    };
}
