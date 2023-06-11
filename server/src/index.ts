import { schedule } from 'node-cron';
import { loadConfig } from './loaders/loadConfig';
import { loadExpress, startApp } from './loaders/loadExpress';
import { loadMongo } from './loaders/loadMongo';
import { initializeModService } from './services/ModService';
import { getLastUpdate, initializeUpdateService, performUpdate, performUpdateSingular } from './services/UpdateService';

async function main() {
    const config = loadConfig();
    const db = await loadMongo(config);

    initializeUpdateService(db);
    await initializeModService(db);

    const app = loadExpress(config);

    await startApp(app, config.port);

    // perform background update every `updateIntervalHours` hours
    schedule(`0 */${config.updateIntervalHours} * * *`, performUpdate);

    const lastUpdated = await getLastUpdate();

    if (lastUpdated === null) {
        performUpdate();
    } else {
        const updatedHoursAgo = Math.floor(
            (Date.now() - new Date(lastUpdated.timestamp).getTime()) / (1_000 * 60 * 60),
        );
        if (updatedHoursAgo >= config.updateIntervalHours) {
            performUpdate();
        }
    }

    // perform background update for oldest updated mod every `smallUpdateInterval` minutes
    const smallUpdateJob = schedule(`*/${config.smallUpdateIntervalMinutes} * * * *`, async () => {
        const timeout = setTimeout(() => {
            console.log(`Small update timed out (max ${config.smallUpdateIntervalMinutes} minutes), stopping job`);
            smallUpdateJob.stop();
        }, config.smallUpdateIntervalMinutes * 60 * 1_000);

        await performUpdateSingular();

        clearTimeout(timeout);
    });
}

main();
