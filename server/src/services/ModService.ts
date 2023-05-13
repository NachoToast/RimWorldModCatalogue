/*
ModService:

This services handles all interactions with the mods database, such as:

- Upserting mods.
- Getting the total number of mods.
- Searching mods.
*/

import { AnyBulkWriteOperation, Collection, Db } from 'mongodb';
import { Mod } from '../types/Mod';

let model: Collection<Mod> | null = null;

export async function initializeModService(mongoDb: Db): Promise<void> {
    model = mongoDb.collection('meta');
    await model.createIndex({ description: 'text' });
}

function getModel(): Collection<Mod> {
    if (model === null) throw new Error('ModService called before being initialized!');
    return model;
}

export async function getTotalModCount(): Promise<number> {
    return await getModel().estimatedDocumentCount();
}

export async function upsert(mods: Mod[]): Promise<void> {
    if (mods.length === 0) return;

    const bulkUpdateOperations = mods.map<AnyBulkWriteOperation<Mod>>((mod) => ({
        updateOne: {
            filter: { _id: mod._id },
            update: { $set: mod },
            upsert: true,
        },
    }));

    await getModel().bulkWrite(bulkUpdateOperations);
}
