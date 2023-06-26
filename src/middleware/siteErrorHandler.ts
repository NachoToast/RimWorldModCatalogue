import { Response } from 'express';
import { SiteError, SiteErrorObject } from '../errors/SiteError';
import { MiddlewareProvider } from '../types/MiddlewareProvider';

export const siteErrorHandler: MiddlewareProvider = () => {
    return (err, req, res: Response<SiteErrorObject>, next) => {
        if (err instanceof SiteError) {
            if (req.app.get('env') === 'development') console.log(`${req.method} ${req.url}`, err);

            res.status(err.statusCode).json({
                title: err.title,
                description: err.description,
                additionalData: err.additionalData,
            });
        } else next(err);
    };
};
