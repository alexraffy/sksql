

//// WEB SOCKET MESSAGES
import {TAuthSession} from "./TAuthSession";

export const WSRAuthenticatePlease: string = "WSRAP";
export interface TWSRAuthenticatePleaseResponse {
    id: number;
}
export const WSRAuthenticate: string = "WSRA";
export interface TWSRAuthenticateRequest {
    id: number;
    info: TAuthSession;
}
export interface TWSRAuthenticateResponse {
    con_id: number;
}

export const WSRDataRequest: string = "DR";
export interface TWSRDataRequest {
    id: number;
}
export interface TWSRDataResponse {
    id: number;
    type: "T" | "B";
    data: Uint8Array
}
export const WSRON: string = "ON";
export interface TWSRON {
    id: number;
    name: string;
}

export const WSROFF: string = "OFF";
export interface TWSROFF {
    id: number;
}


export const WSRSQL: string = "SQL";
export interface TWSRSQL {
    r: string;
    id: number;
}




