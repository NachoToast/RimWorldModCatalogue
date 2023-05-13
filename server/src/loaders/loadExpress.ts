/* eslint-disable import/no-named-as-default-member */
import express, { Express } from 'express';
import { serve, setup } from 'swagger-ui-express';
import { Config } from '../types/Config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const apiSpec = require('../../openapi.json');

export function loadExpress(config: Config): Express {
    const app = express();

    app.set('trust proxy', config.numProxies);

    app.use('/api-docs', serve, setup(apiSpec, { customSiteTitle: 'RimWorld Mod Catalogue API' }));

    app.use('/spec', express.static('openapi.json'));

    app.use(express.json());

    return app;
}
