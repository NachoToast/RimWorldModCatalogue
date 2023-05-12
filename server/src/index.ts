import { schedule } from 'node-cron';
import { MetadataService } from './classes/MetadataService';
import { ModService } from './classes/ModService';
import { WorkshopFetcher } from './classes/WorkshopFetcher';
import { loadConfig } from './loaders/loadConfig';
import { loadMongo } from './loaders/loadMongo';
import { Colours } from './types/Colours';

// temporary code to test the build process, this is designed so the process does not exit unless a SIGTERM is passed
async function main() {
    const config = loadConfig();
    const { modModel, databaseMetadataModel } = await loadMongo(config);

    const modService = new ModService(modModel);
    const metadataService = new MetadataService(databaseMetadataModel);

    console.log('connected :)');

    schedule('0 */6 * * *', () => {
        // every 6 hours
        updateDatabase(modService, metadataService);
    });

    if ((await metadataService.getDatabaseMetadata()) === null || !false) {
        updateDatabase(modService, metadataService);
    }
}

async function updateDatabase(modService: ModService, metadataService: MetadataService): Promise<void> {
    const metadata = await metadataService.getDatabaseMetadata();
    const startTime = new Date();

    console.log(`Background update starting (${startTime.toLocaleString('en-NZ')})`);

    const fetcher = new WorkshopFetcher(true, metadata !== null ? new Date(metadata.lastUpdated) : undefined);
    console.log(`[1/5] Fetching ${Colours.FgCyan}number of pages${Colours.Reset}...`);

    const initialPageData = await fetcher.fetchNumPages();
    console.log(
        `[2/5] Fetching ${Colours.FgMagenta}mod IDs${Colours.Reset} from ${Colours.FgCyan}${initialPageData.pageCount}${Colours.Reset} pages...`,
    );

    const modIds = await fetcher.fetchAllPages(initialPageData);
    console.log(
        `[3/5] Fetching ${Colours.FgGreen}data${Colours.Reset} for ${Colours.FgMagenta}${modIds.length}${Colours.Reset} mods IDs...`,
    );

    const allMods = await fetcher.fetchAllItems(modIds);
    console.log(`[4/5] Updating ${Colours.FgGreen}${allMods.length}${Colours.Reset} mods in the database...`);

    await modService.upsert(allMods);
    console.log('[5/5] Updating metadata...');

    await metadataService.updateDatabaseMetadata({
        lastUpdated: startTime.toISOString(),
        numModsUpdated: allMods.length,
    });
    console.log(
        `Background update completed successfully (took ${Math.floor(
            (Date.now() - startTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s)`,
    );
}

main();
