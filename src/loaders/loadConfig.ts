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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const importedConfig: ImportedConfig = require('../../config.json');

    if (importedConfig.mongoURI === undefined) {
        console.log(
            `${Colours.FgRed}mongoURI${Colours.Reset} is missing from ${Colours.FgMagenta}config.json${Colours.Reset}`,
        );
        process.exit();
    }

    // special value transformations

    const clientUrls: Config['clientUrls'] = importedConfig.clientUrls
        ? new Set(importedConfig.clientUrls)
        : defaultConfig.clientUrls;

    const rateLimitBypassTokens: Config['rateLimitBypassTokens'] = importedConfig.rateLimitBypassTokens
        ? new Set(importedConfig.rateLimitBypassTokens)
        : defaultConfig.rateLimitBypassTokens;

    return {
        ...defaultConfig,
        ...importedConfig,
        mongoURI: importedConfig.mongoURI,
        clientUrls,
        rateLimitBypassTokens,
    };
}
