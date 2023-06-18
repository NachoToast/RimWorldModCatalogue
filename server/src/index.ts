import { writeFileSync } from 'fs';
import { schedule } from 'node-cron';
import { loadConfig } from './loaders/loadConfig';
import { loadExpress, startApp } from './loaders/loadExpress';
import { loadMongo } from './loaders/loadMongo';
import { initializeModService } from './services/ModService';
import { getLastUpdate, initializeUpdateService, performUpdate, performUpdateSingular } from './services/UpdateService';

process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error, promise) => {
    console.log('Unhandled rejection:', promise);
    console.log('The error was:', error);
});

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
        const handleJobErrorOrTimeout = () => {
            smallUpdateJob.stop();
            setTimeout(() => {
                // wait 10x as long before restarting job
                smallUpdateJob.start();
            }, config.smallUpdateIntervalMinutes * 60 * 1_000 * 10);
        };

        const timeout = setTimeout(() => {
            console.log(
                `Small update timed out (max ${config.smallUpdateIntervalMinutes} minutes), stopping job for a while`,
            );
            handleJobErrorOrTimeout();
        }, config.smallUpdateIntervalMinutes * 60 * 1_000);

        try {
            await performUpdateSingular();
        } catch (error) {
            console.log('Small update errored (see error.log for more information), stopping job for a while');
            if (error instanceof Error) {
                writeFileSync('error.log', `${error.toString()}\n${error.stack ?? '(No stack)'}`, 'utf-8');
            } else {
                writeFileSync('error.log', `${error}`, 'utf-8');
            }
            handleJobErrorOrTimeout();
        } finally {
            clearTimeout(timeout);
        }
    });
}

main();
