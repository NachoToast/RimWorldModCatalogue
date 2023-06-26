import { Db, MongoClient } from 'mongodb';
import { Colours } from '../types/Colours';
import { Config } from '../types/Config';

export async function loadMongo(config: Config): Promise<Db> {
    if (config.mongoDbName.length > 38) {
        console.log(
            `${Colours.FgRed}Mongo DB name cannot be more than 38 characters long (configured is ${config.mongoDbName.length})${Colours.Reset}`,
        );
        process.exit();
    }

    const mongoClient = await new MongoClient(config.mongoURI).connect();

    const db = mongoClient.db(config.mongoDbName);

    return db;
}
