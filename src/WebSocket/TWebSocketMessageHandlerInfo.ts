



export interface TWebSocketMessageHandlerInfo {
    message: string;
    handlers: ((string, any) => void)[];
}
