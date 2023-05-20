import { Express, Request, Response } from 'express';
import { getMod, getTotalModCount, searchMods } from './services/ModService';
import { getLastUpdate } from './services/UpdateService';
import { Config } from './types/Config';
import { Mod } from './types/shared/Mod';
import { ModSearchOptions } from './types/shared/ModSearchOptions';
import { WithPagination } from './types/shared/Page';
import { RootResponse } from './types/shared/RootResponse';

export function applyRoutes(app: Express, config: Config) {
    app.get('/', (_req, res) => {
        res.status(200).send(
            'You found the RimWorld Mod Catalogue API!<br />Having a look around? Check out the <a href="/api-docs">API documentation</a>!',
        );
    });

    app.post('/', async (_req, res: Response<RootResponse>) => {
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

    app.get(
        '/mods',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (req: Request<any, any, any, ModSearchOptions>, res: Response<WithPagination<Mod> | object>) => {
            res.status(200).json(await searchMods(req.query));
        },
    );

    app.get('/mods/:id', async (req, res: Response<Mod>) => {
        const mod = await getMod(req.params.id);
        if (mod === null) res.sendStatus(404);
        else res.status(200).send(mod);
    });
}
