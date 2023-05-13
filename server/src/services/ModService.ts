import { AnyBulkWriteOperation } from 'mongodb';
import { ModModel } from '../models/ModModel';
import { Mod } from '../types/Mod';

/** Handles all interactions with the mods database. */
export class ModService {
    private readonly _model: ModModel;

    public constructor(modModel: ModModel) {
        this._model = modModel;
    }

    public async upsert(mods: Mod[]): Promise<void> {
        if (mods.length === 0) return;

        const bulkUpdateOperations = mods.map<AnyBulkWriteOperation<Mod>>((mod) => ({
            updateOne: {
                filter: { _id: mod._id },
                update: { $set: mod },
                upsert: true,
            },
        }));

        await this._model.bulkWrite(bulkUpdateOperations);
    }

    public async getTotalMods(): Promise<number> {
        return await this._model.estimatedDocumentCount();
    }
}
