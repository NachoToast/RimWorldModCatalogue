import { Response } from 'express';
import { HttpError, ValidationErrorItem } from 'express-openapi-validator/dist/framework/types';
import { SiteErrorObject } from '../errors/SiteError';
import { MiddlewareProvider } from '../types/MiddlewareProvider';

/** Custom error messages for OpenAPI validation errors. */
export const validatorErrorHandler: MiddlewareProvider =
    () => (err, _req, res: Response<SiteErrorObject<ValidationErrorItem[]>>, next) => {
        if (err instanceof HttpError) {
            res.status(400).json({
                title: 'Bad Request',
                description: 'Your client made an invalid request to the API.',
                additionalData: err.errors,
            });
        } else next(err);
    };
