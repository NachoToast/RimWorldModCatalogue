import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^@shared$': '<rootDir>/../shared/',
    }
};

export default config;
