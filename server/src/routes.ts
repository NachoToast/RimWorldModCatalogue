import { Express } from 'express';
import { MetadataService } from './services/MetadataService';
import { ModService } from './services/ModService';
import { Config } from './types/Config';

export function applyRoutes(app: Express, config: Config, modService: ModService, metadataService: MetadataService) {
    app.get('/', (_req, res) => {
        res.status(200).send(
            'You found the RimWorld Mod Catalogue API!<br />Having a look around? Check out the <a href="/api-docs">API documentation</a>!',
        );
    });

    app.post('/', async (_req, res) => {
        const [totalMods, metadata] = await Promise.all([
            modService.getTotalMods(),
            metadataService.getDatabaseMetadata(),
        ]);

        res.status(200).json({
            startTime: config.startedAt,
            commit: config.commit,
            receivedRequest: new Date().toISOString(),
            estimatedModCount: totalMods,
            lastUpdate:
                metadata !== null
                    ? {
                          at: metadata.lastUpdated,
                          count: metadata.numModsUpdated,
                      }
                    : undefined,
        });
    });

    app.get('/ip', (req, res) => {
        res.status(200).send(req.ip);
    });
}
