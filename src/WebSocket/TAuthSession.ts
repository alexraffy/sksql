


export interface TAuthSession {
    // set by client
    name: string; // a name for the connection
    token?: string; // a token for authentication
    remoteOnly: boolean; // if set to true, the client connection will not receive a copy of the database
    // set by server
    valid?: boolean; // the connection was accepted
    id?: string; // the connection id
    readOnly?: boolean; // if set to true, the client will not be able to modify the database
    accessRights?: string | "RW" | "R" | "W" | "N";
}