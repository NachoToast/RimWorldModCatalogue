import { DatabaseMetadataModel } from '../models/DatabaseMetadataModel';
import { DatabaseMetadata } from '../types/DatabaseMetadata';

/** Handles retreiving and updating database metadata. */
export class MetadataService {
    private _model: DatabaseMetadataModel;

    public constructor(databaseMetadataModel: DatabaseMetadataModel) {
        this._model = databaseMetadataModel;
    }

    public async getDatabaseMetadata(): Promise<DatabaseMetadata | null> {
        const metadata = await this._model.findOne({});
        return metadata;
    }

    public async updateDatabaseMetadata(metadata: DatabaseMetadata): Promise<void> {
        await this._model.updateOne({}, { $set: metadata }, { upsert: true });
    }
}
