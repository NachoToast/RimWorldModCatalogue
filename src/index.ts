import { schedule } from 'node-cron';
import { loadConfig } from './loaders/loadConfig';
import { loadExpress, startApp } from './loaders/loadExpress';
import { loadMongo } from './loaders/loadMongo';
import { initializeModService } from './services/ModService';
import { getLastUpdate, initializeUpdateService, performUpdate, performUpdateSingular } from './services/UpdateService';
import { Config } from './types/Config';

process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error, promise) => {
    console.log('Unhandled rejection:', promise);
    console.log('The error was:', error);
});

/** 
 * Checks if the database has mods in it, and executes a first-time fetch if it doesn't, or if they haven't been
 * updated in more than the configured `updateIntervalHours`.
 */
async function conditionalStartupDatabaseCheck(config: Config): Promise<void> {
    const lastUpdated = await getLastUpdate();

    if (lastUpdated === null) {
        performUpdate(null);
    } else {
        const updatedHoursAgo = Math.floor(
            (Date.now() - new Date(lastUpdated.timestamp).getTime()) / (1_000 * 60 * 60),
        );
        if (updatedHoursAgo >= config.updateIntervalHours) {
            performUpdate(lastUpdated);
        }
    }
}

async function main() {
    const config = loadConfig();
    const db = await loadMongo(config);

    initializeUpdateService(db);
    await initializeModService(db);

    const app = loadExpress(config);

    await startApp(app, config.port);

    // perform background update every `updateIntervalHours` hours
    schedule(`0 */${config.updateIntervalHours} * * *`, () => performUpdate());

    // perform background update for oldest updated mod every `smallUpdateInterval` minutes
    const smallUpdateJob = schedule(`*/${config.smallUpdateIntervalMinutes} * * * *`, async () => {
        const handleJobErrorOrTimeout = <T extends 'timeout' | 'error'>(
            reason: T,
            ctx: T extends 'error' ? unknown : null,
        ) => {
            if (reason === 'timeout') {
                console.log(
                    `Small update timed out (max ${config.smallUpdateIntervalMinutes} minutes), stopping job for ${
                        config.smallUpdateIntervalMinutes * 10
                    } minutes`,
                );
            } else {
                console.log(
                    `Small update errored, stopping job for ${config.smallUpdateIntervalMinutes * 10} minutes`,
                    ctx,
                );
            }

            smallUpdateJob.stop();

            setTimeout(() => {
                // wait 10x as long before restarting job
                smallUpdateJob.start();
            }, config.smallUpdateIntervalMinutes * 60 * 1_000 * 10);
        };

        const timeout = setTimeout(
            () => handleJobErrorOrTimeout('timeout', null),
            config.smallUpdateIntervalMinutes * 60 * 1_000,
        );

        try {
            await performUpdateSingular();
        } catch (error) {
            handleJobErrorOrTimeout('error', error);
        } finally {
            clearTimeout(timeout);
        }
    });

    conditionalStartupDatabaseCheck(config);
}

main();
