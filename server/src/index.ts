import { schedule } from 'node-cron';
import { loadConfig } from './loaders/loadConfig';
import { loadExpress } from './loaders/loadExpress';
import { loadMongo } from './loaders/loadMongo';
import { applyRoutes } from './routes';
import { initializeModService } from './services/ModService';
import { getLastUpdate, initializeUpdateService, performUpdate } from './services/UpdateService';
import { Colours } from './types/Colours';
import { Config } from './types/Config';

async function main() {
    const config = loadConfig();
    const db = await loadMongo(config);

    initializeUpdateService(db);
    await initializeModService(db);

    startAPI(config);

    schedule('0 */6 * * *', performUpdate); // every 6 hours

    if ((await getLastUpdate()) === null) {
        performUpdate();
    }
}

function startAPI(config: Config): void {
    const app = loadExpress(config);

    applyRoutes(app, config);

    const server = app.listen(config.port, () => {
        const _addr = server.address();

        let address, port;

        if (typeof _addr !== 'string' && _addr !== null) {
            address = _addr.address.replace('::', 'localhost');
            port = _addr.port;
        } else {
            address = 'unknown';
            port = config.port;
        }

        console.log(`Listening on ${Colours.FgCyan}http://${address}:${port}${Colours.Reset} (${app.get('env')})`);
    });
}

main();
