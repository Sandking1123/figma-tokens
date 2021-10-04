export type StorageType = {
    provider: StorageProviderType;
    id?: string;
    name?: string;
};

export type ApiDataType = {
    id: string;
    secret: string;
    provider: StorageProviderType;
    name: string;
    new?: boolean;
};

export enum StorageProviderType {
    LOCAL = 'local',
    ARCADE = 'arcade',
    JSONBIN = 'jsonbin',
}

export interface ContextObject extends ApiDataType {
    secret: string;
    id: string;
    tokens: string;
}
