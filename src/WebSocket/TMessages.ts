

//// WEB SOCKET MESSAGES
import {TAuthSession} from "./TAuthSession";
import {TDate} from "../Query/Types/TDate";
import {numeric} from "../Numeric/numeric";
import {TableColumnType} from "../Table/TableColumnType";

export const WSRAuthenticatePlease: string = "WSRAP";
export interface TWSRAuthenticatePleaseResponse {
    id: number;
}
export const WSRAuthenticate: string = "WSRA";
export interface TWSRAuthenticateRequest {
    id: number;
    info: TAuthSession;
    remoteMode: boolean;
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
    indexTable: number;
    indexBlock: number;
    tableName: string;
    size: number;
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
    p: { name: string; type: TableColumnType, value: string | number | numeric | TDate | boolean}[]
}

export const WSROK: string = "OK";


export const WSRGNID: string = "GNID";
export interface TWSRGNID {
    uid: string;
    table: string;
    count: number;
}
export interface TWSRGNIDResponse {
    uid: string;
    ids: number[]
}
