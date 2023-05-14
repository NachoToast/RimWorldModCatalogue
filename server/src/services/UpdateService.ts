/*
UpdateService:

This service handles the background update process.
It is designed to be run on a schedule, and will:

- Fetch newly updated/created mods from the workshop.
- Update the database with the new mods.
- Update the database metadata with the new timestamp.
*/

import { Collection, Db } from 'mongodb';
import { WorkshopFetcher } from '../classes/WorkshopFetcher';
import { Colours } from '../types/Colours';
import { ISOString } from '../types/Utility';
import { upsert } from './ModService';

interface UpdateData {
    timestamp: ISOString;
    numUpdated: number;
    numErrored: number;
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

async function performInitialWorkshopFetch(): Promise<void> {
    const updateStartTime = new Date();

    console.log('Initial mod insert starting, please do not exit the process');
    const fetcher = new WorkshopFetcher(true);

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
    await upsert(allMods);

    console.log('[5/5] Saving results...');
    await setLastUpdate({
        timestamp: updateStartTime.toISOString(),
        numUpdated: allMods.length,
        numErrored: 0,
    });

    console.log(
        `Initial mod insert completed successfully (took ${Math.floor(
            (Date.now() - updateStartTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s)`,
    );
}

async function performWorkshopUpdate(timestamp: number, mode: 'posted' | 'updated'): Promise<void> {
    const updateStartTime = new Date();

    const fetcher = new WorkshopFetcher(false, mode === 'posted' ? timestamp : 0, mode === 'updated' ? timestamp : 0);

    const initialPageData = await fetcher.fetchNumPages();

    const modIds = await fetcher.fetchAllPages(initialPageData);

    const allMods = await fetcher.fetchAllItems(modIds);

    await upsert(allMods);

    await setLastUpdate({
        timestamp: updateStartTime.toISOString(),
        numUpdated: allMods.length,
        numErrored: 0,
    });

    console.log(
        `Background refresh for ${mode === 'posted' ? Colours.FgMagenta : Colours.FgCyan}${mode}${
            Colours.Reset
        } mods completed successfully (took ${Math.floor(
            (Date.now() - updateStartTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s, ${allMods.length} mods updated, ${0} errored)`,
    );
}

export async function performUpdate(): Promise<void> {
    const lastUpdate = await getLastUpdate();

    if (lastUpdate === null) return await performInitialWorkshopFetch();

    let timestamp = Math.floor(new Date(lastUpdate.timestamp).getTime() / 1000);

    timestamp -= 24 * 60 * 60 * 3; // 3 days because Steam timestamps are weird

    await Promise.all([performWorkshopUpdate(timestamp, 'posted'), performWorkshopUpdate(timestamp, 'updated')]);
}
