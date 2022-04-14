/* eslint-disable import/prefer-default-export */
import { createModel } from '@rematch/core';
import isEqual from 'lodash.isequal';
import omit from 'just-omit';
import { StorageProviderType } from '@/types/api';
import defaultJSON from '@/config/default.json';

import parseTokenValues from '@/utils/parseTokenValues';
import { notifyToUI } from '@/plugin/notifiers';
import { replaceReferences } from '@/utils/findReferences';
import parseJson from '@/utils/parseJson';
import updateTokensOnSources from '../updateSources';
import * as pjs from '../../../../package.json';
import { AnyTokenList, SingleToken, TokenStore } from '@/types/tokens';
import {
  DeleteTokenPayload,
  SetTokenDataPayload,
  SetTokensFromStylesPayload,
  ToggleManyTokenSetsPayload,
  UpdateDocumentPayload,
  UpdateTokenPayload,
} from '@/types/payloads';
import { updateTokenPayloadToSingleToken } from '@/utils/updateTokenPayloadToSingleToken';
import { RootModel } from '@/types/RootModel';
import { TokenSetStatus } from '@/constants/TokenSetStatus';
import { UsedTokenSetsMap } from '@/types';

const defaultTokens: TokenStore = {
  version: pjs.plugin_version,
  updatedAt: new Date().toString(),
  // @TODO this may not be correct
  values: parseTokenValues(defaultJSON as unknown as SetTokenDataPayload['values']),
};
export interface TokenState {
  tokens: Record<string, AnyTokenList>;
  lastSyncedState: string;
  importedTokens: {
    newTokens: SingleToken[];
    updatedTokens: SingleToken[];
  };
  activeTokenSet: string;
  usedTokenSet: UsedTokenSetsMap;
  editProhibited: boolean;
  hasUnsavedChanges: boolean;
}

export const tokenState = createModel<RootModel>()({
  state: {
    tokens: {
      global: [],
    },
    lastSyncedState: JSON.stringify({ global: {} }, null, 2),
    importedTokens: {
      newTokens: [],
      updatedTokens: [],
    },
    activeTokenSet: 'global',
    usedTokenSet: ['global'],
    editProhibited: false,
    hasUnsavedChanges: false,
  } as unknown as TokenState,
  reducers: {
    setEditProhibited(state, payload: boolean) {
      return {
        ...state,
        editProhibited: payload,
      };
    },
    toggleUsedTokenSet: (state, tokenSet: string) => ({
      ...state,
      usedTokenSet: {
        ...state.usedTokenSet,
        // @README it was decided the user can not simply toggle to the intermediate SOURCE state
        // this means for toggling we only switch between ENABLED and DISABLED
        // setting as source is a separate action
        [tokenSet]: state.usedTokenSet[tokenSet] === TokenSetStatus.DISABLED
          ? TokenSetStatus.ENABLED
          : TokenSetStatus.DISABLED,
      },
    }),
    toggleManyTokenSets: (state, data: ToggleManyTokenSetsPayload) => {
      const oldSetsWithoutInput = Object.fromEntries(
        Object.entries(state.usedTokenSet)
          .filter(([tokenSet]) => !data.sets.includes(tokenSet)),
      );

      if (data.shouldCheck) {
        return {
          ...state,
          usedTokenSet: {
            ...oldSetsWithoutInput,
            ...Object.fromEntries(data.sets.map((tokenSet) => ([tokenSet, TokenSetStatus.ENABLED]))),
          },
        };
      }

      return {
        ...state,
        usedTokenSet: {
          ...oldSetsWithoutInput,
          ...Object.fromEntries(data.sets.map((tokenSet) => ([tokenSet, TokenSetStatus.DISABLED]))),
          // @README see comment (1) - ensure that all token sets are always available
        },
      };
    },
    toggleTreatAsSource: (state, tokenSet: string) => ({
      ...state,
      usedTokenSet: {
        ...state.usedTokenSet,
        [tokenSet]: state.usedTokenSet[tokenSet] === TokenSetStatus.SOURCE
          ? TokenSetStatus.DISABLED
          : TokenSetStatus.SOURCE,
      },
    }),
    setActiveTokenSet: (state, data: string) => ({
      ...state,
      activeTokenSet: data,
    }),
    addTokenSet: (state, name: string): TokenState => {
      if (name in state.tokens) {
        notifyToUI('Token set already exists', { error: true });
        return state;
      }
      return {
        ...state,
        usedTokenSet: {
          ...state.usedTokenSet,
          [name]: TokenSetStatus.DISABLED, // @README see comment (1)
        },
        tokens: {
          ...state.tokens,
          [name]: [],
        },
      };
    },
    deleteTokenSet: (state, name: string) => {
      const oldTokens = { ...state.tokens };
      delete oldTokens[name];
      return {
        ...state,
        tokens: oldTokens,
        activeTokenSet: state.activeTokenSet === name
          ? Object.keys(state.tokens)[0]
          : state.activeTokenSet,
        usedTokenSet: omit({ ...state.usedTokenSet }, name),
      };
    },
    renameTokenSet: (state, data: { oldName: string; newName: string }) => {
      const oldTokens = { ...state.tokens };
      if (Object.keys(oldTokens).includes(data.newName) && data.oldName !== data.newName) {
        notifyToUI('Token set already exists', { error: true });
        return state;
      }
      oldTokens[data.newName] = oldTokens[data.oldName];
      delete oldTokens[data.oldName];
      return {
        ...state,
        tokens: oldTokens,
        activeTokenSet: state.activeTokenSet === data.oldName ? data.newName : state.activeTokenSet,
      };
    },
    setLastSyncedState: (state, data: string) => ({
      ...state,
      lastSyncedState: data,
    }),
    setTokenSetOrder: (state, data: string[]) => {
      const newTokens = {};
      data.forEach((set) => {
        Object.assign(newTokens, { [set]: state.tokens[set] });
      });
      return {
        ...state,
        tokens: newTokens,
      };
    },
    resetImportedTokens: (state) => ({
      ...state,
      importedTokens: {
        newTokens: [],
        updatedTokens: [],
      },
    }),
    setTokenData: (state, data: SetTokenDataPayload) => {
      const values = parseTokenValues(data.values);
      const allAvailableTokenSets = Object.keys(values);
      const usedTokenSets = Object.fromEntries(
        allAvailableTokenSets
          .map((tokenSet) => ([tokenSet, data.usedTokenSet?.[tokenSet] ?? TokenSetStatus.DISABLED])),
      );
      // @README (1) for the sake of normalization we will set the DISABLED status for all available token sets
      // this way we can always be certain the status is available. This behavior is also reflected in the createTokenSet logic
      return {
        ...state,
        tokens: values,
        activeTokenSet: Array.isArray(data.values) ? 'global' : Object.keys(data.values)[0],
        usedTokenSet: Array.isArray(data.values)
          ? { global: TokenSetStatus.ENABLED }
          : usedTokenSets,
      };
    },
    setJSONData(state, payload) {
      const parsedTokens = parseJson(payload);
      parseTokenValues(parsedTokens);
      const values = parseTokenValues({ [state.activeTokenSet]: parsedTokens });
      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...values,
        },
      };
    },
    setHasUnsavedChanges(state, payload: boolean) {
      return {
        ...state,
        hasUnsavedChanges: payload,
      };
    },
    setTokens: (state, newTokens) => ({
      ...state,
      tokens: newTokens,
    }),
    createToken: (state, data: UpdateTokenPayload) => {
      let newTokens: TokenStore['values'] = {};
      const existingToken = state.tokens[data.parent].find((n) => n.name === data.name);
      if (!existingToken) {
        newTokens = {
          [data.parent]: [
            ...state.tokens[data.parent],
            updateTokenPayloadToSingleToken(data),
          ],
        };
      }
      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...newTokens,
        },
      };
    },
    duplicateToken: (state, data: UpdateTokenPayload) => {
      let newTokens: TokenStore['values'] = {};
      const existingTokenIndex = state.tokens[data.parent].findIndex((n) => n.name === data.name);
      if (existingTokenIndex > -1) {
        const newName = `${data.name}-copy`;
        const existingTokens = [...state.tokens[data.parent]];
        existingTokens.splice(existingTokenIndex + 1, 0, {
          ...state.tokens[data.parent][existingTokenIndex],
          name: newName,
        });

        newTokens = {
          [data.parent]: existingTokens,
        };
      }
      return {
        ...state,
        tokens: {
          ...state.tokens,
          ...newTokens,
        },
      };
    },
    // Imports received styles as tokens, if needed
    setTokensFromStyles: (state, receivedStyles: SetTokensFromStylesPayload) => {
      const newTokens: SingleToken[] = [];
      const existingTokens: SingleToken[] = [];
      const updatedTokens: SingleToken[] = [];

      // Iterate over received styles and check if they existed before or need updating
      Object.values(receivedStyles).forEach((values) => {
        values.forEach((token) => {
          const oldValue = state.tokens[state.activeTokenSet].find((t) => t.name === token.name);
          if (oldValue) {
            if (isEqual(oldValue.value, token.value)) {
              if (
                oldValue.description === token.description
                || (typeof token.description === 'undefined' && oldValue.description === '')
              ) {
                existingTokens.push(token);
              } else {
                updatedTokens.push({
                  ...token,
                  oldDescription: oldValue.description,
                });
              }
            } else {
              const updatedToken = { ...token };
              updatedToken.oldValue = oldValue.value;
              updatedTokens.push(updatedToken);
            }
          } else {
            newTokens.push(token);
          }
        });
      });

      return {
        ...state,
        importedTokens: {
          newTokens,
          updatedTokens,
        },
      };
    },
    editToken: (state, data: UpdateTokenPayload) => {
      const nameToFind = data.oldName ? data.oldName : data.name;
      const index = state.tokens[data.parent].findIndex((token) => token.name === nameToFind);
      const newArray = [...state.tokens[data.parent]];
      newArray[index] = {
        ...newArray[index],
        ...updateTokenPayloadToSingleToken(data),
      } as SingleToken;

      return {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: newArray,
        },
      };
    },
    deleteToken: (state, data: DeleteTokenPayload) => {
      const newState = {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: state.tokens[data.parent].filter((token) => token.name !== data.path),
        },
      };

      return newState;
    },
    deleteTokenGroup: (state, data: DeleteTokenPayload) => {
      const newState = {
        ...state,
        tokens: {
          ...state.tokens,
          [data.parent]: state.tokens[data.parent].filter((token) => !token.name.startsWith(data.path)),
        },
      };

      return newState;
    },
    updateAliases: (state, data: { oldName: string; newName: string }) => {
      const newTokens = Object.entries(state.tokens).reduce<TokenState['tokens']>(
        (acc, [key, values]) => {
          const newValues = values.map<SingleToken>((token) => {
            if (Array.isArray(token.value)) {
              return {
                ...token,
                value: token.value.map((t) => Object.entries(t).reduce<Record<string, string | number>>((a, [k, v]) => {
                  a[k] = replaceReferences(v.toString(), data.oldName, data.newName);
                  return a;
                }, {})),
              } as SingleToken;
            }
            if (typeof token.value === 'object') {
              return {
                ...token,
                value: Object.entries(token.value).reduce<Record<string, string | number>>((a, [k, v]) => {
                  a[k] = replaceReferences(v.toString(), data.oldName, data.newName);
                  return a;
                }, {}),
              } as SingleToken;
            }

            return {
              ...token,
              value: replaceReferences(token.value.toString(), data.oldName, data.newName),
            } as SingleToken;
          });

          acc[key] = newValues;
          return acc;
        },
        {},
      );

      return {
        ...state,
        tokens: newTokens,
      };
    },
  },
  effects: (dispatch) => ({
    setDefaultTokens: () => {
      dispatch.tokenState.setTokenData({ values: defaultTokens.values });
    },
    setEmptyTokens: () => {
      dispatch.tokenState.setTokenData({ values: [] });
    },
    editToken(payload: UpdateTokenPayload, rootState) {
      if (payload.oldName && payload.oldName !== payload.name) {
        dispatch.tokenState.updateAliases({ oldName: payload.oldName, newName: payload.name });
      }

      if (payload.shouldUpdate && rootState.settings.updateOnChange) {
        dispatch.tokenState.updateDocument();
      }
    },
    deleteToken() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    deleteTokenGroup() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    addTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    renameTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    deleteTokenSet() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    setTokenSetOrder() {
      dispatch.tokenState.updateDocument({ shouldUpdateNodes: false });
    },
    setJSONData() {
      dispatch.tokenState.updateDocument();
    },
    setTokenData(payload: SetTokenDataPayload) {
      if (payload.shouldUpdate) {
        dispatch.tokenState.updateDocument();
      }
    },
    toggleUsedTokenSet() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    toggleManyTokenSets() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    toggleTreatAsSource() {
      dispatch.tokenState.updateDocument({ updateRemote: false });
    },
    duplicateToken(payload: UpdateTokenPayload, rootState) {
      if (payload.shouldUpdate && rootState.settings.updateOnChange) {
        dispatch.tokenState.updateDocument();
      }
    },
    createToken(payload: UpdateTokenPayload, rootState) {
      if (payload.shouldUpdate && rootState.settings.updateOnChange) {
        dispatch.tokenState.updateDocument();
      }
    },
    updateDocument(options?: UpdateDocumentPayload, rootState?) {
      const defaults = { shouldUpdateNodes: true, updateRemote: true };
      const params = { ...defaults, ...options };
      try {
        updateTokensOnSources({
          tokens: params.shouldUpdateNodes ? rootState.tokenState.tokens : null,
          tokenValues: rootState.tokenState.tokens,
          usedTokenSet: rootState.tokenState.usedTokenSet,
          settings: rootState.settings,
          updatedAt: new Date().toString(),
          lastUpdatedAt: rootState.uiState.lastUpdatedAt,
          isLocal: rootState.uiState.storageType.provider === StorageProviderType.LOCAL,
          editProhibited: rootState.tokenState.editProhibited,
          api: rootState.uiState.api,
          storageType: rootState.uiState.storageType,
          shouldUpdateRemote: params.updateRemote && rootState.settings.updateRemote,
        });
      } catch (e) {
        console.error('Error updating document', e);
      }
    },
  }),
});
