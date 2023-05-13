import { corsMiddleware } from '../../src/middleware/corsMiddleware';
import { stubApp } from '../helpers/stubApp';

describe(corsMiddleware.name, () => {
    describe('wildcard ["*"] whitelist', () => {
        const app = stubApp({ clientUrls: new Set(['*']) }, [corsMiddleware]);

        it('allows an undefined origin', async () => {
            const response = await app.get('/').send();

            expect(response.statusCode).toBe(200);
        });

        it('allows any origin', async () => {
            const response = await app.get('/').set('origin', 'https://example.com').send();

            expect(response.statusCode).toBe(200);
        });

        it('has a wildcard Access-Control-Allow-Origin', async () => {
            const [response1, response2] = await Promise.all([
                app.get('/').set('origin', 'https://example.com').send(),
                app.get('/').set('origin', 'https://google.com').send(),
            ]);

            expect(response1.headers['access-control-allow-origin']).toBe('*');
            expect(response2.headers['access-control-allow-origin']).toBe('*');
        });
    });

    describe('static whitelist', () => {
        const app = stubApp({ clientUrls: new Set(['https://example.com']) }, [corsMiddleware]);

        it('allows an undefined origin', async () => {
            const response = await app.get('/').send();

            expect(response.statusCode).toBe(200);
        });

        it("doesn't allow non-whitelisted origins", async () => {
            const response = await app.get('/').set('origin', 'https://google.com').send();

            expect(response.statusCode).toBe(400);
        });

        it('allows whitelisted origins', async () => {
            const response = await app.get('/').set('origin', 'https://example.com').send();

            expect(response.statusCode).toBe(200);
        });

        it('has a matching Access-Control-Allow-Origin header', async () => {
            const response = await app.get('/').set('origin', 'https://example.com').send();

            expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
        });
    });
});
