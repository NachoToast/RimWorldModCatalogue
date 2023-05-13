import { Express } from 'express';
import { getTotalModCount } from './services/ModService';
import { getLastUpdate } from './services/UpdateService';
import { Config } from './types/Config';

export function applyRoutes(app: Express, config: Config) {
    app.get('/', (_req, res) => {
        res.status(200).send(
            'You found the RimWorld Mod Catalogue API!<br />Having a look around? Check out the <a href="/api-docs">API documentation</a>!',
        );
    });

    app.post('/', async (_req, res) => {
        const [totalMods, lastUpdate] = await Promise.all([getTotalModCount(), getLastUpdate()]);

        res.status(200).json({
            startTime: config.startedAt,
            commit: config.commit,
            receivedRequest: new Date().toISOString(),
            estimatedModCount: totalMods,
            lastUpdate,
        });
    });

    app.get('/ip', (req, res) => {
        res.status(200).send(req.ip);
    });
}
