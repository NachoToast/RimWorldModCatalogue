/*
UpdateService:

This service handles the background update process.
It is designed to be run on a schedule, and will:

- Fetch newly updated/created mods from the workshop.
- Update the database with the new mods.
- Update the database metadata with the new timestamp.
*/

import { Collection, Db } from 'mongodb';
import { MassRequester } from '../classes/MassRequester';
import { WorkshopFetcher } from '../classes/WorkshopFetcher';
import { Colours } from '../types/Colours';
import { Mod } from '../types/Mod';
import { ISOString } from '../types/Utility';
import { upsertMods } from './ModService';

interface UpdateData {
    timestamp: ISOString;
    numInserted: number;
    numUpdated: number;
    numErrored: number;
    numSkipped: number;
}

let model: Collection<UpdateData> | null = null;

export function initializeUpdateService(mongoDb: Db): void {
    model = mongoDb.collection('meta');
}

function getModel(): Collection<UpdateData> {
    if (model === null) throw new Error('UpdateService called before being initialized!');
    return model;
}

export async function getLastUpdate(): Promise<UpdateData | null> {
    const lastUpdate = await getModel().findOne<UpdateData>({});
    if (lastUpdate !== null && '_id' in lastUpdate) delete lastUpdate?._id;
    return lastUpdate;
}

export async function setLastUpdate(newUpdate: UpdateData): Promise<void> {
    await getModel().updateOne({}, { $set: newUpdate }, { upsert: true });
}

/** Performs a first-time fetch to populate the database with ALL mods on the workshop. */
async function performInitialWorkshopFetch(): Promise<void> {
    const updateStartTime = new Date();

    console.log('Initial mod fetch starting, please do not exit the process');
    const fetcher = new WorkshopFetcher(true);

    // fetch number of pages
    console.log(`[1/5] Fetching ${Colours.FgCyan}number of pages${Colours.Reset}...`);
    const pageCount = await fetcher.fetchNumPages();

    // fetch mod ids from each page
    console.log(
        `[2/5] Fetching ${Colours.FgMagenta}mod IDs${Colours.Reset} from ${Colours.FgCyan}${pageCount}${Colours.Reset} pages...`,
    );
    const pageEmitter = await fetcher.fetchAllPages(pageCount);

    let numPagesReceived = 0;

    const modIds: string[] = [];

    pageEmitter.on('chunk', (pageChunk) => {
        numPagesReceived += pageChunk.length;
        modIds.push(...pageChunk.flat());
    });

    await new Promise<void>((resolve) => {
        pageEmitter.on('done', (errors) => {
            MassRequester.logErrors(errors, 'pages');
            resolve();
        });
    });

    // fetch mod data from each id
    console.log(
        `[3/5] Fetching ${Colours.FgGreen}mod data${Colours.Reset} for ${Colours.FgMagenta}${modIds.length}${Colours.Reset} mod IDs across ${Colours.FgCyan}${numPagesReceived}${Colours.Reset} pages...`,
    );

    let modsErrored = 0;
    let modsSkipped = 0;

    const upsertPromises: Promise<[inserted: number, updated: number]>[] = [];

    const modEmitter = await fetcher.fetchAllMods(modIds.flat());

    // upsert each mod as each chunk is received
    modEmitter.on('chunk', (modChunk) => {
        const trueModChunk = modChunk.filter((mod): mod is Mod => mod !== null);
        upsertPromises.push(upsertMods(trueModChunk));
        modsSkipped += modChunk.length - trueModChunk.length;
    });

    await new Promise<void>((resolve) => {
        modEmitter.on('done', (errors) => {
            MassRequester.logErrors(errors, 'mods');
            modsErrored = errors.length;
            resolve();
        });
    });

    console.log(`[4/5] Updating database (${upsertPromises.length} operations)...`);

    // most upserts should have already completed by this point
    // sum up the number of inserted and updated mods
    const [inserted, updated] = (await Promise.all(upsertPromises)).reduce(
        (a, b) => [a[0] + b[0], a[1] + b[1]],
        [0, 0],
    );

    // save stats to last update
    console.log(
        `[5/5] Saving results (${Colours.FgGreen}inserted${Colours.Reset} = ${inserted}, ${Colours.FgMagenta}updated${Colours.Reset} = ${updated}, ${Colours.FgRed}errored${Colours.Reset} = ${modsErrored}, ${Colours.FgYellow}skipped${Colours.Reset} = ${modsSkipped})...`,
    );
    await setLastUpdate({
        timestamp: updateStartTime.toISOString(),
        numInserted: inserted,
        numUpdated: updated,
        numErrored: modsErrored,
        numSkipped: modsSkipped,
    });

    console.log(
        `Initial mod fetch completed successfully (took ${Math.floor(
            (Date.now() - updateStartTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s)`,
    );
}

/** Performs a background fetch to get new/updated mods on the workshop */
async function performBackgroundWorkshopFetch(timestamp: number, mode: 'posted' | 'updated'): Promise<UpdateData> {
    const updateStartTime = new Date();

    console.log(
        `Background mod fetch starting for ${mode === 'posted' ? Colours.FgMagenta : Colours.FgCyan}${mode}${
            Colours.Reset
        } mods`,
    );
    // timestamps are AND chained by Steam, so can only have 1 non-zero
    const fetcher = new WorkshopFetcher(false, mode === 'posted' ? timestamp : 0, mode === 'updated' ? timestamp : 0);

    let modsErrored = 0;
    let modsSkipped = 0;
    const upsertPromises: Promise<[inserted: number, updated: number]>[] = [];

    const modEmitter = await fetcher.fetchAllMods();

    // upsert each mod as each chunk is received
    modEmitter.on('chunk', (modChunk) => {
        const trueModChunk = modChunk.filter((mod): mod is Mod => mod !== null);
        upsertPromises.push(upsertMods(trueModChunk));
        modsSkipped += modChunk.length - trueModChunk.length;
    });

    await new Promise<void>((resolve) => {
        modEmitter.on('done', (errors) => {
            MassRequester.logErrors(errors, 'mods');
            modsErrored = errors.length;
            resolve();
        });
    });

    // most upserts should have already completed by this point
    // sum up the number of inserted and updated mods
    const [inserted, updated] = (await Promise.all(upsertPromises)).reduce(
        (a, b) => [a[0] + b[0], a[1] + b[1]],
        [0, 0],
    );

    console.log(
        `Background refresh for ${mode === 'posted' ? Colours.FgMagenta : Colours.FgCyan}${mode}${
            Colours.Reset
        } mods completed successfully (took ${Math.floor(
            (Date.now() - updateStartTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s, ${Colours.FgGreen}inserted${Colours.Reset} = ${inserted}, ${
            Colours.FgMagenta
        }updated${Colours.Reset} = ${updated}, ${Colours.FgRed}errored${Colours.Reset} = ${modsErrored}, ${
            Colours.FgYellow
        }skipped${Colours.Reset} = ${modsSkipped})`,
    );

    // return stats instead of saving
    return {
        timestamp: updateStartTime.toISOString(),
        numInserted: inserted,
        numUpdated: updated,
        numErrored: modsErrored,
        numSkipped: modsSkipped,
    };
}

export async function performUpdate(): Promise<void> {
    const lastUpdate = await getLastUpdate();

    if (lastUpdate === null) return await performInitialWorkshopFetch();

    let timestamp = Math.floor(new Date(lastUpdate.timestamp).getTime() / 1_000);

    timestamp -= 24 * 60 * 60 * 1; // 1 day because Steam timestamps are weird sometimes

    const startTime = Date.now();
    console.log('Starting background mod fetches');

    const updateResponses = await Promise.all([
        performBackgroundWorkshopFetch(timestamp, 'posted'),
        performBackgroundWorkshopFetch(timestamp, 'updated'),
    ]);

    // choose lower (older) timestamp, and sum up the rest
    await setLastUpdate({
        timestamp:
            updateResponses[0].timestamp <= updateResponses[1].timestamp
                ? updateResponses[0].timestamp
                : updateResponses[1].timestamp,
        numInserted: updateResponses[0].numInserted + updateResponses[1].numInserted,
        numUpdated: updateResponses[0].numUpdated + updateResponses[1].numUpdated,
        numErrored: updateResponses[0].numErrored + updateResponses[1].numErrored,
        numSkipped: updateResponses[0].numSkipped + updateResponses[1].numSkipped,
    });

    console.log(`Finished background mod fetches (took ${Math.floor((Date.now() - startTime) / 1_000)}s)`);
}
