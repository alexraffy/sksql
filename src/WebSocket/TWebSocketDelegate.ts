import {TSocketResponse} from "./TSocketResponse";


export interface TWebSocketDelegate {
    databaseHashId: string;
    on(databaseHashId: string, msg: TSocketResponse);
    connectionLost?(databaseHashId: string);
    connectionError?(databaseHashId: string, error: string);
}
