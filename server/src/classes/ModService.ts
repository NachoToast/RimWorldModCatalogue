import { AnyBulkWriteOperation } from 'mongodb';
import { Mod } from '../../../shared/types/Mod';
import { ModModel } from '../models/ModModel';

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
}
