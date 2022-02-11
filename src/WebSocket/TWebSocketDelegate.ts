import {TSocketResponse} from "./TSocketResponse";
import {SKSQL} from "../API/SKSQL";


export interface TWebSocketDelegate {
    databaseHashId: string;
    on(db: SKSQL, databaseHashId: string, msg: TSocketResponse);
    connectionLost?(db: SKSQL, databaseHashId: string);
    connectionError?(db: SKSQL, databaseHashId: string, error: string);
}
