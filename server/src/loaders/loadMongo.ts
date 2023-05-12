import { MongoClient } from 'mongodb';
import { DatabaseMetadataModel } from '../models/DatabaseMetadataModel';
import { ModModel } from '../models/ModModel';
import { Colours } from '../types/Colours';
import { Config } from '../types/Config';

export async function loadMongo(
    config: Config,
): Promise<{ modModel: ModModel; databaseMetadataModel: DatabaseMetadataModel; mongoClient: MongoClient }> {
    if (config.mongoDbName.length > 38) {
        console.log(
            `${Colours.FgRed}Mongo DB name cannot be more than 38 characters long (configured is ${config.mongoDbName.length})${Colours.Reset}`,
        );
        process.exit();
    }

    const mongoClient = await new MongoClient(config.mongoURI).connect();

    const db = mongoClient.db(config.mongoDbName);

    const modModel: ModModel = db.collection('mods');

    const databaseMetadataModel: DatabaseMetadataModel = db.collection('meta');

    await modModel.createIndex({ description: 'text' });

    return { modModel, databaseMetadataModel, mongoClient };
}
