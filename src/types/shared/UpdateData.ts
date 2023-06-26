import { ISOString } from './Utility';

export interface UpdateData {
    timestamp: ISOString;
    numInserted: number;
    numUpdated: number;
    numErrored: number;
    numSkipped: number;
}
