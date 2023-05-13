import { defaultConfig } from '../../src/constants/defaultConfig';
import { Config } from '../../src/types/Config';

export const mockedConfig: Config = {
    ...defaultConfig,
    mongoURI: 'mocked config mongoURI',
};
