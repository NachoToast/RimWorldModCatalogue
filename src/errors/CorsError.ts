import { SiteError } from './SiteError';

export class CorsError extends SiteError {
    public readonly statusCode = 400;

    public constructor() {
        super('Invalid Origin', 'The origin header of your request is invalid (CORS).', undefined);
    }
}
