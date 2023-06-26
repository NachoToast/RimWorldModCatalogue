import * as OpenApiValidator from 'express-openapi-validator';
import { validatorMiddleware } from '../../src/middleware/validatorMiddleware';
import { mockedConfig } from '../mocks/mockedConfig';

jest.mock('express-openapi-validator');

const mockedValidator = jest.mocked(OpenApiValidator);

describe(validatorMiddleware.name, () => {
    it('invokes the underlying openAPI validator middleware', () => {
        validatorMiddleware(mockedConfig);

        expect(mockedValidator.middleware).toBeCalledTimes(1);
    });
});
