/* eslint-disable import/no-named-as-default-member */
import express, { Express } from 'express';
import nunjucks from 'nunjucks';
import { serve, setup } from 'swagger-ui-express';
import { corsMiddleware } from '../middleware/corsMiddleware';
import { rateLimitingMiddleware } from '../middleware/rateLimitingMiddleware';
import { siteErrorHandler } from '../middleware/siteErrorHandler';
import { validatorErrorHandler } from '../middleware/validatorErrorHandler';
import { validatorMiddleware } from '../middleware/validatorMiddleware';
import { applyRoutes } from '../routes';
import { Colours } from '../types/Colours';
import { Config } from '../types/Config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const apiSpec = require('../../openapi.json');

export function loadExpress(config: Config): Express {
    const app = express();

    app.set('trust proxy', config.numProxies);

    app.use('/api-docs', serve, setup(apiSpec, { customSiteTitle: 'RimWorld Mod Catalogue API' }));

    app.use('/spec', express.static('openapi.json'));

    app.use('/favicon.ico', express.static('client/favicon.ico'));

    app.use(express.json());

    nunjucks.configure('client', {
        autoescape: true,
        express: app,
    });

    {
        // pre-route middleware (e.g. validation, authentication)
        app.use(express.json());
        app.use(corsMiddleware(config));
        app.use(rateLimitingMiddleware(config));
        app.use(validatorMiddleware(config));
        // this error handler is pre-route since validator errors are thrown by the validator middleware, meaning we
        // can catch them before the route is called
        app.use(validatorErrorHandler(config));
    }

    applyRoutes(app, config);

    {
        // post-route middleware (e.g. error catching).
        app.use(siteErrorHandler(config));
    }

    return app;
}

export function startApp(app: Express, port: number): Promise<void> {
    return new Promise<void>((resolve) => {
        const server = app.listen(port, () => {
            const _addr = server.address();

            let address, port;

            if (typeof _addr !== 'string' && _addr !== null) {
                address = _addr.address.replace('::', 'localhost');
                port = _addr.port;
            } else {
                address = 'unknown';
            }

            console.log(`Listening on ${Colours.FgCyan}http://${address}:${port}${Colours.Reset} (${app.get('env')})`);

            resolve();
        });
    });
}
