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
        window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://rimworldmods.nachotoast.com',
};

function loadConfig() {
    const existingConfig = localStorage.getItem(KEY);
    if (existingConfig !== null) {
        return {
            ...defaultConfig,
            ...JSON.parse(existingConfig),
        };
    } else {
        return { ...defaultConfig };
    }
}

function saveConfig() {
    const output: Partial<Config> = {};
    for (const k in window.config) {
        const key = k as keyof Config;
        if (window.config[key] !== defaultConfig[key]) {
            output[key] = window.config[key];
        }
    }
    localStorage.setItem(KEY, JSON.stringify(output));
}

window.config = loadConfig();
window.saveConfig = saveConfig;
