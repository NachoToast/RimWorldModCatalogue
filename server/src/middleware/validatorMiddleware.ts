import * as OpenApiValidator from 'express-openapi-validator';
import { MiddlewareProvider } from '../types/MiddlewareProvider';

export const validatorMiddleware: MiddlewareProvider = () => {
    return OpenApiValidator.middleware({
        apiSpec: 'openapi.json',
        validateRequests: true,
        validateResponses: true,
    });
};
