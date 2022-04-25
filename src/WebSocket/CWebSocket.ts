import {TWebSocketDelegate} from "./TWebSocketDelegate";
import {TSocketResponse} from "./TSocketResponse";
import {
    TWSRAuthenticatePleaseResponse,
    TWSRAuthenticateRequest,
    TWSRAuthenticateResponse,
    WSRAuthenticatePlease
} from "./TMessages";
import {TSocketRequest} from "./TSocketRequest";
import {TWebSocketMessageHandlerInfo} from "./TWebSocketMessageHandlerInfo";
import {SKSQL} from "../API/SKSQL";


const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export class CWebSocket {
    private db: SKSQL;
    private databaseHashId: string;

    private address: string;
    private _supported: boolean;
    private _delegate: TWebSocketDelegate;
    private _connection: WebSocket | Object;
    private handlers: TWebSocketMessageHandlerInfo[] = [];

    private _con_id: number = 0;
    private msg_count: number = 0;

    private outGoing: string[] = [];
    private _connected: boolean = false;

    public get connected(): boolean {
        return this._connected;
    }
    public get con_id(): number {
        return this._con_id;
    }


    constructor(db: SKSQL, databaseHashId: string) {
        this.db = db;
        this.databaseHashId = databaseHashId;
        if (isBrowser) {
            // @ts-ignore
            window.WebSocket = window.WebSocket || window.MozWebSocket;
            this._supported = true;
        } else {
            this._supported = false;
        }
        if (global !== undefined) {
            global["CWebSocket"] = this;
        } else {
            window["CWebSocket"] = this;
        }
    }


    get supported(): boolean {
        return this._supported;
    }


    get delegate(): TWebSocketDelegate {
        return this._delegate;
    }
    set delegate(value: TWebSocketDelegate) {
        this._delegate = value;
    }


    connect(address): Promise<boolean> {
        this.address = address;
        return new Promise<boolean>( (resolve, reject) => {
            // open connection
            var ws;
            try {
                if (typeof WebSocket !== 'undefined') {
                    ws = WebSocket
                    // @ts-ignore
                } else if (typeof MozWebSocket !== 'undefined') {
                    // @ts-ignore
                    ws = MozWebSocket
                } else if (typeof global !== 'undefined') {
                    // @ts-ignore
                    ws = global.WebSocket || global.MozWebSocket
                } else if (typeof window !== 'undefined') {
                    // @ts-ignore
                    ws = window.WebSocket || window.MozWebSocket
                } else if (typeof self !== 'undefined') {
                    // @ts-ignore
                    ws = self.WebSocket || self.MozWebSocket
                }
            } catch (e) {
                ws = require("ws");
            }
                var connection = undefined;
                try {
                    connection = new ws(address); // ('ws://127.0.0.1:1041');
                } catch (errorConnection) {
                    return reject({message: "Could not connect to socket"});
                }
                connection.onopen = () => {
                    this._connection = connection;
                    this._connected = true;
                    resolve(true);
                };
                connection.onerror = function (error) {
                    console.dir(error);
                };
                connection.onclose = () => {

                    this._connected = false;
                    if (this.delegate !== undefined && this.delegate.connectionLost !== undefined) {
                        this.delegate.connectionLost(this.db, this.databaseHashId);
                    }
                    if (this._connection === undefined) {
                        reject({message: "Could not connect to socket"});
                    } else {
                        // do not reconnect automatically
                        //this.connect(this.address).then((value: boolean) => {
                        //    console.log("Reconnected.");
                        //});
                    }
                }
                connection.onmessage = (message) => {
                    //console.dir(message);
                    if (message.type === "message") {
                        let data = JSON.parse(message.data) as TSocketResponse;
                        let con_id = data.id;
                        let msg_id = data.msg_id;
                        let prev_id = data.prev_id;
                        let msg = data.message;
                        let param = data.param;
                        if (msg === WSRAuthenticatePlease) {
                            this._con_id = (data.param as TWSRAuthenticatePleaseResponse).id;
                        }
                        if (this.delegate !== undefined) {
                            this.delegate.on(this.db, this.databaseHashId, data);
                        }

                        // do we have an external handler
                        for (let i = 0; i < this.handlers.length; i++) {
                            const h = this.handlers[i];
                            if (h.message === msg) {
                                for (let x = 0; x < h.handlers.length; x++) {
                                    if (h.handlers[x] !== undefined) {
                                        h.handlers[x](msg, param);
                                    }
                                }
                            }
                        }

                    }
                    return false;
                }


        });
    }


    close() {
        if (isBrowser) {
            (this._connection as WebSocket).close();
        } else {
            // @ts-ignore
            this._connection.close();
        }
    }

    send(message: string, param: any) {

        //if (isBrowser) {
            let payload: TSocketRequest = {
                id: this.con_id,
                msg_id: ++this.msg_count,
                message: message,
                param: param
            };
            if (this._connection === undefined) {
                this.outGoing.push(JSON.stringify(payload));
            } else {
                this.sendOutgoing();
                (this._connection as WebSocket).send(JSON.stringify(payload));
            }
       // }
    }


    registerForCallback(uid: string, message: string, callback: (message: string, payload: any) => void) {
        this.handlers.push(
            {
                uid: uid,
                message: message,
                handlers: [callback]
            }
        );
    }

    deregisterCallback(uid: string) {
        let idx = -1;
        for (let i = 0; i < this.handlers.length; i++) {
            if (this.handlers[i].uid === uid) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            this.handlers.splice(idx, 1);
        }
    }

    private sendOutgoing() {
        if (this._connection !== undefined) {
            //while (this.outGoing.length > 0) {
            //    let msg = this.outGoing.shift();
            //    (this._connection as WebSocket).send(msg);
            //}
        }
    }



}