



export interface TWebSocketMessageHandlerInfo {
    uid: string;
    message: string;
    handlers: ((string, any) => void)[];
}
