import {TAuthSession} from "../WebSocket/TAuthSession";
import {SKSQL} from "./SKSQL";


// Delegate events for <SKSQL instance>.connect

export interface TDBEventsDelegate {
    on?(db: SKSQL, databaseHashId: string, message: string, payload: any): void;
    connectionLost?(db: SKSQL, databaseHashId: string): void;
    connectionError?(db: SKSQL, databaseHashId: string, error: string);
    authRequired(db: SKSQL, databaseHashId: string): TAuthSession;
    ready(db: SKSQL, databaseHashId: string);
}