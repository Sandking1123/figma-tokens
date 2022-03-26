import { settings } from './settings';
import { uiState } from './uiState';
import { tokenState } from './tokenState';
import { inspectState } from './inspectState';
import { RootModel } from '@/types/RootModel';

export const models: RootModel = {
  uiState, settings, tokenState, inspectState,
};
