import { Collection } from 'mongodb';
import { ISOString } from './Utility';

export interface DatabaseMetadata {
    lastUpdated: ISOString;
    numModsUpdated: number;
}

export type DatabaseMetadataModel = Collection<DatabaseMetadata>;
