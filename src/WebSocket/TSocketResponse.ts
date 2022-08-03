
export interface TSocketResponse {
    id: string; // client id
    msg_id: number;
    prev_id: number;
    message: string;
    param?: any;
}