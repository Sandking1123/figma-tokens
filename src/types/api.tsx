import { StorageProviderType } from '@/constants/StorageProviderType';

export type StorageType = {
  provider: StorageProviderType;
  id?: string;
  name?: string;
  filePath?: string;
  branch?: string;
};

export type ApiDataType = {
  id: string;
  secret: string;
  provider: StorageProviderType;
  name: string;
  branch?: string;
  new?: boolean;
  filePath?: string;
  baseUrl?: string
};

export interface ContextObject extends ApiDataType {
  branch?: string;
  filePath?: string;
  tokens?: string;
  baseUrl?: string
  internalId?: string;
  updatedAt?: string;
}

export interface StoredCredentials {
  id: string;
  provider: StorageProviderType;
  filePath?: string;
  branch?: string;
  name?: string;
}
