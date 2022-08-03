

//// WEB SOCKET MESSAGES
import {TAuthSession} from "./TAuthSession";
import {TDate} from "../Query/Types/TDate";
import {numeric} from "../Numeric/numeric";
import {TableColumnType} from "../Table/TableColumnType";
import {TSQLResult} from "../API/TSQLResult";
import {kModifiedBlockType} from "../ExecutionPlan/TExecutionContext";

// Ask the client that just connected to send a WSRAuthenticate message
// origin: Server
export const WSRAuthenticatePlease: string = "WSRAP";
export interface TWSRAuthenticatePleaseResponse {
    id: string; // a temporary id to identify the connection
}

// Send authentication information to the server
// origin: Client
// id should be the same id as received in the WSRAuthenticatePlease message
// info is a TAuthSession structure, containing at least a name for the connection and an optional token
// if commandMode is set to true, the client only receives the tables headers and all SQL messages
// from that client is only executed on the server without any data being returned or broadcasted to other connected clients
export const WSRAuthenticate: string = "WSRA";
export interface TWSRAuthenticateRequest {
    id: string;
    info: TAuthSession;
}
// Response to WSRAuthenticate
// origin: Server
// if the authentication is accepted,
// returns a final id for the connection
export interface TWSRAuthenticateResponse {
    con_id: string; // the id for the connection
    info: TAuthSession;
}

// Request a copy of the database
// origin: Client or Server running in Relay mode
export const WSRDataRequest: string = "DR";
export interface TWSRDataRequest {
    id: string;
}

// A compressed table header or a table block
// origin: Server
export interface TWSRDataResponse {
    id: string;
    type: kModifiedBlockType;
    indexTable: number;
    indexBlock: number;
    tableName: string;
    size: number;
    data: Uint8Array
}

// The server is done sending data
// origin: Server
export const WSROK: string = "OK";


// A user has connected to the server
// origin: Server
export const WSRON: string = "ON";
export interface TWSRON {
    name: string;
}
// A user has disconnected from the server
// origin: Server
export const WSROFF: string = "OFF";
export interface TWSROFF {
    name: string;
}

// Execute an SQL statement
// origin: Client/Server
// When a client executes an SQL query that modifies data, the server receives
// this message, after executing it locally, it sends the request to all the other connected clients.
export const WSRSQL: string = "SQL";
export interface TWSRSQL {
    r: string; // request
    id: string; //  id for the client
    u: string; // guid for the request
    rd: boolean; // ask to return data
    b: boolean; // broadcast result to other clients
    // list of parameters
    p: { name: string; type: TableColumnType, value: string | number | numeric | TDate | boolean}[]
}

// Result of a WSRSQL message
// origin: Server
//
export const WSRSQLResponse: string = "SQLR";
export interface TWSRSQLResponse {
    r: string; // the client request
    id: string; // client id
    u: string; // guid for the request
    res: TSQLResult;
    t: TWSRDataResponse[]; // a list of headers and blocks
}

// Request new identities from a table
// origin: Client
// increment the identity of a table
export const WSRGNID: string = "GNID";
export interface TWSRGNID {
    uid: string;
    table: string;
    count: number;
}
// Send a list of identities in response to a WSRGNID message
// origin: Server
export interface TWSRGNIDResponse {
    uid: string;
    ids: number[]
}
