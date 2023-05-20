import { UpdateData } from './UpdateData';
import { ISOString } from './Utility';

export interface RootResponse {
    startTime: ISOString;
    commit: string;
    receivedRequest: ISOString;
    estimatedModCount: number;
    lastUpdate: UpdateData | null;
}
