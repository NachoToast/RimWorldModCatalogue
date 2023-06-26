import express from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import request from 'supertest';
import { validatorErrorHandler } from '../../src/middleware/validatorErrorHandler';
import { mockedConfig } from '../mocks/mockedConfig';

describe(validatorErrorHandler.name, () => {
    it('catches HttpErrors', async () => {
        const app = express();

        app.get('/', () => {
            throw new HttpError({ name: '', path: '', status: 401 });
        });

        app.use(validatorErrorHandler(mockedConfig));

        const res = await request(app).get('/').send();

        expect(res.statusCode).toBe(400);
    });

    it('skips other Errors', async () => {
        const app = express();

        app.get('/', () => {
            throw new Error();
        });

        app.use(validatorErrorHandler(mockedConfig));

        const res = await request(app).get('/').send();

        expect(res.statusCode).toBe(500);
    });
});
