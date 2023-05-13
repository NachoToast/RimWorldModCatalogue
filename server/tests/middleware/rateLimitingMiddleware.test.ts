import { rateLimitingMiddleware } from '../../src/middleware/rateLimitingMiddleware';
import { stubApp } from '../helpers/stubApp';

describe(rateLimitingMiddleware.name, () => {
    it('rate limits according to config', async () => {
        const app = stubApp({ maxRequestsPerMinute: 2 }, [rateLimitingMiddleware]);

        const [response1, response2] = await Promise.all([app.get('/').send(), app.get('/').send()]);
        const response3 = await app.get('/').send();

        expect(response1.statusCode).toBe(200);
        expect(response2.statusCode).toBe(200);
        expect(response3.statusCode).toBe(429);
    });

    it('accepts valid RateLimit-Bypass-Token headers', async () => {
        const app = stubApp({ maxRequestsPerMinute: 1, rateLimitBypassTokens: new Set(['someBypassToken']) }, [
            rateLimitingMiddleware,
        ]);

        await app.get('/').send(); // now we should be ratelimited on all subsequent requests

        const [nonBypassResponse, bypassResponse] = await Promise.all([
            app.get('/').send(),
            app.get('/').set('RateLimit-Bypass-Token', 'someBypassToken').send(),
        ]);

        expect(nonBypassResponse.statusCode).toBe(429);
        expect(bypassResponse.statusCode).toBe(200);

        expect(bypassResponse.headers['ratelimit-bypass-response']).toBe('Valid');
    });

    it('gives feedback for invalid RateLimit-Bypass-Token headers', async () => {
        const app = stubApp({ maxRequestsPerMinute: 1, rateLimitBypassTokens: new Set(['someBypassToken']) }, [
            rateLimitingMiddleware,
        ]);

        await app.get('/').send(); // now we should be ratelimited on all subsequent requests

        const invalidTokenResponse = await app.get('/').set('RateLimit-Bypass-Token', 'someOtherBypassToken').send();

        expect(invalidTokenResponse.statusCode).toBe(429);

        expect(invalidTokenResponse.headers['ratelimit-bypass-response']).toBe('Invalid');
    });
});
