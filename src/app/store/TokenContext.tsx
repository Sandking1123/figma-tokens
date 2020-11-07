import * as React from 'react';
import JSON5 from 'json5';
import {defaultJSON} from '../../config/default';
import TokenData, {TokenProps} from '../components/TokenData';
import * as pjs from '../../../package.json';

export interface SelectionValue {
    borderRadius: string | undefined;
    horizontalPadding: string | undefined;
    verticalPadding: string | undefined;
    itemSpacing: string | undefined;
}

export enum ActionType {
    SetTokenData = 'SET_TOKEN_DATA',
    SetTokensFromStyles = 'SET_TOKENS_FROM_STYLES',
    SetDefaultTokens = 'SET_DEFAULT_TOKENS',
    SetEmptyTokens = 'SET_EMPTY_TOKENS',
    SetLoading = 'SET_LOADING',
    SetStringTokens = 'SET_STRING_TOKENS',
    UpdateTokens = 'UPDATE_TOKENS',
    CreateStyles = 'CREATE_STYLES',
    SetNodeData = 'SET_NODE_DATA',
    RemoveNodeData = 'REMOVE_NODE_DATA',
    PullStyles = 'PULL_STYLES',
    SetSelectionValues = 'SET_SELECTION_VALUES',
    ResetSelectionValues = 'RESET_SELECTION_VALUES',
    SetShowEditForm = 'SET_SHOW_EDIT_FORM',
    SetShowOptions = 'SET_SHOW_OPTIONS',
    SetDisplayType = 'SET_DISPLAY_TYPE',
    ToggleColorMode = 'TOGGLE_COLOR_MODE',
}

const defaultTokens: TokenProps = {
    version: pjs.version,
    values: {
        options: JSON5.stringify(defaultJSON(), null, 2),
    },
};

const emptyTokens: TokenProps = {
    version: pjs.version,
    values: {
        options: '{ }',
    },
};

const emptyState = {
    tokens: defaultTokens,
    loading: true,
    tokenData: new TokenData(emptyTokens),
    selectionValues: {},
    displayType: 'GRID',
    colorMode: false,
    showEditForm: false,
    showOptions: false,
};

const TokenStateContext = React.createContext(emptyState);
const TokenDispatchContext = React.createContext(null);

function updateTokens(state: any) {
    parent.postMessage(
        {
            pluginMessage: {
                type: 'update',
                tokenValues: state.tokenData.reduceToValues(),
                tokens: state.tokenData.getMergedTokens(),
            },
        },
        '*'
    );
}

function stateReducer(state, action) {
    switch (action.type) {
        case ActionType.SetTokenData:
            return {
                ...state,
                tokenData: action.data,
            };
        case ActionType.SetTokensFromStyles:
            state.tokenData.injectTokens(action.data);
            updateTokens(state);
            return {
                ...state,
                tokens: state.tokenData.tokens,
            };
        case ActionType.SetDefaultTokens:
            state.tokenData.setTokens(defaultTokens);
            return state;
        case ActionType.SetEmptyTokens:
            return emptyState;
        case ActionType.SetLoading:
            return {
                ...state,
                loading: action.state,
            };
        case ActionType.SetStringTokens:
            state.tokenData.updateTokenValues(action.data.parent, action.data.tokens);
            return {
                ...state,
                tokens: {
                    ...state.tokens,
                    [action.data.parent]: {
                        hasErrored: state.tokenData.checkTokenValidity(action.data.tokens),
                        values: action.data.tokens,
                    },
                },
            };
        case ActionType.UpdateTokens:
            updateTokens(state);
            return state;
        case ActionType.CreateStyles:
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'create-styles',
                        tokens: state.tokenData.getMergedTokens(),
                    },
                },
                '*'
            );
            return state;
        case ActionType.SetNodeData:
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'set-node-data',
                        values: action.data,
                        tokens: state.tokenData.getMergedTokens(),
                    },
                },
                '*'
            );
            return state;
        case ActionType.RemoveNodeData:
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'remove-node-data',
                    },
                },
                '*'
            );
            return state;
        case ActionType.PullStyles:
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'pull-styles',
                        styleTypes: {
                            textStyles: true,
                            colorStyles: true,
                        },
                    },
                },
                '*'
            );
            return state;

        case ActionType.SetSelectionValues:
            return {
                ...state,
                loading: false,
                selectionValues: action.data,
            };
        case ActionType.ResetSelectionValues:
            let newState = {
                ...state,
                loading: false,
                selectionValues: {},
            };

            return newState;
        case ActionType.SetShowEditForm:
            return {
                ...state,
                showEditForm: action.bool,
            };
        case ActionType.SetShowOptions:
            return {
                ...state,
                showOptions: action.data,
            };
        case ActionType.SetDisplayType:
            return {
                ...state,
                displayType: action.data,
            };
        case ActionType.ToggleColorMode:
            return {
                ...state,
                colorMode: !state.colorMode,
            };
        default:
            throw new Error('Not implemented');
    }
}

function TokenProvider({children}) {
    const [state, dispatch] = React.useReducer(stateReducer, emptyState);

    const tokenContext = React.useMemo(
        () => ({
            setTokens: (tokens) => {
                dispatch({type: 'SET_TOKENS', tokens});
            },
            setTokensFromStyles: (data) => {
                dispatch({type: ActionType.SetTokensFromStyles, data});
            },
            setTokenData: (data: TokenData) => {
                dispatch({type: ActionType.SetTokenData, data});
            },
            setStringTokens: (data: {parent: string; tokens: string}) => {
                dispatch({type: ActionType.SetStringTokens, data});
            },
            setDefaultTokens: () => {
                dispatch({type: ActionType.SetDefaultTokens});
                dispatch({type: ActionType.SetLoading, state: false});
            },
            setEmptyTokens: () => {
                dispatch({type: ActionType.SetEmptyTokens});
                dispatch({type: ActionType.SetLoading, state: false});
            },
            updateTokens: () => {
                dispatch({type: ActionType.UpdateTokens});
            },
            createStyles: () => {
                dispatch({type: ActionType.CreateStyles});
            },
            setLoading: (boolean) => {
                dispatch({type: ActionType.SetLoading, state: boolean});
            },
            setNodeData: (data: SelectionValue) => {
                dispatch({type: ActionType.SetNodeData, data});
            },
            removeNodeData: (data: SelectionValue) => {
                dispatch({type: ActionType.RemoveNodeData, data});
            },
            setSelectionValues: (data: SelectionValue) => {
                dispatch({type: ActionType.SetSelectionValues, data});
            },
            resetSelectionValues: () => {
                dispatch({type: ActionType.ResetSelectionValues});
            },
            setShowEditForm: (bool: boolean) => {
                dispatch({type: ActionType.SetShowEditForm, bool});
            },
            setShowOptions: (data: string) => {
                dispatch({type: ActionType.SetShowOptions, data});
            },
            setDisplayType: (data: string) => {
                dispatch({type: ActionType.SetDisplayType, data});
            },
            toggleColorMode: () => {
                dispatch({type: ActionType.ToggleColorMode});
            },
            pullStyles: () => {
                dispatch({type: ActionType.PullStyles});
            },
        }),
        [dispatch]
    );

    return (
        <TokenStateContext.Provider value={state}>
            <TokenDispatchContext.Provider value={tokenContext}>{children}</TokenDispatchContext.Provider>
        </TokenStateContext.Provider>
    );
}

function useTokenState() {
    const context = React.useContext(TokenStateContext);
    if (context === undefined) {
        throw new Error('useTokenState must be used within a TokenProvider');
    }
    return context;
}
function useTokenDispatch() {
    const context = React.useContext(TokenDispatchContext);
    if (context === undefined) {
        throw new Error('useTokenDispatch must be used within a TokenProvider');
    }
    return context;
}

export {TokenProvider, useTokenState, useTokenDispatch};
