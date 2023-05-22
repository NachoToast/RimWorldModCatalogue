// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
interface Window {
    config: Config;
    saveConfig(): void;
}

interface Config {
    serverUrl: string;
    rateLimitBypassToken?: string;
}

const KEY = 'rimworld-mod-catalogue.config';

const defaultConfig: Config = {
    serverUrl:
        window.location.hostname === 'rimworld.nachotoast.com'
            ? 'https://rimworldmods.nachotoast.com'
            : 'http://localhost:5000',
};

function loadConfig(): Config {
    const existingConfig = localStorage.getItem(KEY);

    if (existingConfig !== null) {
        return {
            ...defaultConfig,
            ...JSON.parse(existingConfig),
        };
    }

    return { ...defaultConfig };
}

function saveConfig(): void {
    const output: Partial<Config> = {};
    for (const k in window.config) {
        const key = k as keyof Config;

        // don't store default values
        if (window.config[key] !== defaultConfig[key]) {
            output[key] = window.config[key];
        }
    }

    localStorage.setItem(KEY, JSON.stringify(output));
}

window.config = loadConfig();
window.saveConfig = saveConfig;
