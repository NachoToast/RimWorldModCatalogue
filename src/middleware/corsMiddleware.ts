import cors from 'cors';
import { CorsError } from '../errors/CorsError';
import { MiddlewareProvider } from '../types/MiddlewareProvider';

export const corsMiddleware: MiddlewareProvider = (config) => {
    const { clientUrls } = config;

    return cors({
        origin: clientUrls.has('*')
            ? '*'
            : (origin, callback) => {
                  // origin is undefined on non-browser requests (e.g. Insomnia)
                  if (origin === undefined || clientUrls.has(origin)) callback(null, true);
                  else callback(new CorsError());
              },
        exposedHeaders: [
            'RateLimit-Limit',
            'RateLimit-Remaining',
            'RateLimit-Reset',
            'Retry-After',
            'RateLimit-Bypass-Response',
        ],
    });
};
