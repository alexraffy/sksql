import {TSocketResponse} from "./TSocketResponse";


export interface TWebSocketDelegate {
    on(msg: TSocketResponse);
    connectionLost?();
}
