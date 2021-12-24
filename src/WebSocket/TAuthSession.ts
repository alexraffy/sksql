


export interface TAuthSession {
    valid: boolean;
    name: string;
    token?: string;
    user_guid?: string;
    document_token?: string;
    id?: number;
}