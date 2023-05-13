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
    return await getModel().findOne({});
}

export async function setLastUpdate(newUpdate: UpdateData): Promise<void> {
    await getModel().updateOne({}, { $set: newUpdate }, { upsert: true });
}

export async function performUpdate(): Promise<void> {
    const lastUpdate = await getLastUpdate();
    const updateStartTime = new Date();

    console.log(`Background update starting (${updateStartTime.toLocaleString('en-NZ')})`);

    const fetcher = new WorkshopFetcher(true, lastUpdate !== null ? new Date(lastUpdate.timestamp) : undefined);
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
    console.log('[5/5] Saving result...');

    await setLastUpdate({
        timestamp: updateStartTime.toISOString(),
        numUpdated: allMods.length,
        numErrored: 0,
    });
    console.log(
        `Background update completed successfully (took ${Math.floor(
            (Date.now() - updateStartTime.getTime()) / 1_000,
        ).toLocaleString('en-NZ')}s)`,
    );
}
