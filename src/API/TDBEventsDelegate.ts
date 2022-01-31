import {TAuthSession} from "../WebSocket/TAuthSession";


export interface TDBEventsDelegate {
    on?(databaseHashId: string, message: string, payload: any): void;
    connectionLost?(databaseHashId: string): void;
    connectionError?(databaseHashId: string, error: string);
    authRequired(databaseHashId: string): TAuthSession;
    ready(databaseHashId: string);
}