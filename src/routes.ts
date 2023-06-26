import { Express, Request, Response } from 'express';
import { getMod, getTotalModCount, searchMods } from './services/ModService';
import { getLastUpdate } from './services/UpdateService';
import { Config } from './types/Config';
import { Mod } from './types/Mod';
import { ModSearchOptions } from './types/ModSearchOptions';
import { WithPagination } from './types/Page';
import { RootResponse } from './types/RootResponse';

export function applyRoutes(app: Express, config: Config): void {
    app.get(
        '/',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (req: Request<any, any, any, Partial<ModSearchOptions>>, res: Response<WithPagination<Mod> | object>) => {
            const mods = await searchMods(req.query);

            if (req.accepts('html')) {
                return res.render('index.html', { mods });
            }
            return res.status(200).json(mods);
        },
    );

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

    app.get('/mods/:id', async (req, res: Response<Mod>) => {
        const mod = await getMod(req.params.id);

        if (mod === null) {
            if (req.accepts('html')) return res.render('notFound.html', { id: req.params.id });
            return res.sendStatus(404);
        }
        if (req.accepts('html')) return res.render('mod.html', { mod });
        return res.status(200).send(mod);
    });
}
