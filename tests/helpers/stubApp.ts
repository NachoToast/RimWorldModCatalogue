import express, { RequestHandler } from 'express';
import request from 'supertest';
import { Config } from '../../src/types/Config';
import { MiddlewareProvider } from '../../src/types/MiddlewareProvider';
import { mockedConfig } from '../mocks/mockedConfig';

/** Creates a stub Express app which responds with status code 200 for `GET /` */
export function stubApp(
    partialConfig?: Partial<Config>,
    preRouteMiddlewares?: MiddlewareProvider[],
    postRouteMiddlewares?: MiddlewareProvider[],
    route?: RequestHandler,
): request.SuperTest<request.Test> {
    const app = express();

    const config: Config = { ...mockedConfig, ...partialConfig };

    if (preRouteMiddlewares) {
        for (const middleware of preRouteMiddlewares) {
            app.use(middleware(config));
        }
    }

    if (route) {
        app.get('/', route);
    } else {
        app.get('/', (_req, res) => res.sendStatus(200));
    }

    if (postRouteMiddlewares) {
        for (const middleware of postRouteMiddlewares) {
            app.use(middleware(config));
        }
    }

    return request(app);
}
