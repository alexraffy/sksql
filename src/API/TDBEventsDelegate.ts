import {TAuthSession} from "../WebSocket/TAuthSession";


export interface TDBEventsDelegate {
    on?(message: string, payload: any): void;
    connectionLost?(): void;
    authRequired(): TAuthSession;
}