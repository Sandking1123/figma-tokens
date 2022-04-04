import { useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import isEqual from 'lodash.isequal';
import { postToFigma } from '@/plugin/notifiers';
import { MessageToPluginTypes } from '@/types/messages';
import {
  AnyTokenList,
  SingleToken,
} from '@/types/tokens';
import stringifyTokens from '@/utils/stringifyTokens';
import formatTokens from '@/utils/formatTokens';
import { mergeTokenGroups, resolveTokenValues } from '@/plugin/tokenHelpers';
import { UpdateMode } from '@/types/state';
import useConfirm from '../hooks/useConfirm';
import { Properties } from '@/constants/Properties';
import { track } from '@/utils/analytics';
import { checkIfAlias } from '@/utils/alias';
import {
  activeTokenSetSelector,
  settingsStateSelector,
  tokensSelector,
  usedTokenSetSelector,
} from '@/selectors';

// @TODO fix typings

type ConfirmResult =
  ('textStyles' | 'colorStyles' | 'effectStyles')[]
  | string;

type GetFormattedTokensOptions = {
  includeAllTokens: boolean;
  includeParent: boolean;
  expandTypography: boolean;
  expandShadow: boolean;
};

type RemoveTokensByValueData = { property: Properties; nodes: string[] }[];

export default function useTokens() {
  const usedTokenSet = useSelector(usedTokenSetSelector);
  const activeTokenSet = useSelector(activeTokenSetSelector);
  const tokens = useSelector(tokensSelector);
  const settings = useSelector(settingsStateSelector, isEqual);
  const { confirm } = useConfirm<ConfirmResult>();

  // Gets value of token
  const getTokenValue = useCallback((name: string, resolved: AnyTokenList) => (
    resolved.find((t) => t.name === name)
  ), []);

  // Returns resolved value of a specific token
  const isAlias = useCallback((token: SingleToken, resolvedTokens: AnyTokenList) => (
    checkIfAlias(token, resolvedTokens)
  ), []);

  // Returns formatted tokens for style dictionary
  const getFormattedTokens = useCallback((opts: GetFormattedTokensOptions) => {
    const {
      includeAllTokens = false, includeParent = true, expandTypography = false, expandShadow = false,
    } = opts;
    const tokenSets = includeAllTokens ? Object.keys(tokens) : [activeTokenSet];
    return formatTokens({
      tokens, tokenSets, includeAllTokens, includeParent, expandTypography, expandShadow,
    });
  }, [tokens, activeTokenSet]);

  // Returns stringified tokens for the JSON editor
  const getStringTokens = useCallback(() => (
    stringifyTokens(tokens, activeTokenSet)
  ), [tokens, activeTokenSet]);

  // Calls Figma asking for all local text- and color styles
  const pullStyles = useCallback(async () => {
    const userDecision = await confirm({
      text: 'Import styles',
      description: 'What styles should be imported?',
      confirmAction: 'Import',
      choices: [
        { key: 'colorStyles', label: 'Color', enabled: true },
        { key: 'textStyles', label: 'Text', enabled: true },
        { key: 'effectStyles', label: 'Shadows', enabled: true },
      ],
    });

    if (userDecision && Array.isArray(userDecision.data) && userDecision.data.length) {
      track('Import styles', {
        textStyles: userDecision.data.includes('textStyles'),
        colorStyles: userDecision.data.includes('colorStyles'),
        effectStyles: userDecision.data.includes('effectStyles'),
      });

      postToFigma({
        type: MessageToPluginTypes.PULL_STYLES,
        styleTypes: {
          textStyles: userDecision.data.includes('textStyles'),
          colorStyles: userDecision.data.includes('colorStyles'),
          effectStyles: userDecision.data.includes('effectStyles'),
        },
      });
    }
  }, [confirm]);

  const removeTokensByValue = useCallback((data: RemoveTokensByValueData) => {
    track('removeTokensByValue', { count: data.length });

    postToFigma({
      type: MessageToPluginTypes.REMOVE_TOKENS_BY_VALUE,
      tokensToRemove: data,
    });
  }, []);

  const handleRemap = useCallback(async (type: Properties, name: string) => {
    const userDecision = await confirm({
      text: `Choose a new token for ${name}`,
      input: {
        type: 'text',
        placeholder: 'New token name',
      },
      confirmAction: 'Remap',
    });

    if (userDecision && typeof userDecision.data === 'string') {
      track('remapToken', { fromInspect: true });

      postToFigma({
        type: MessageToPluginTypes.REMAP_TOKENS,
        category: type,
        oldName: name,
        newName: userDecision.data,
        updateMode: UpdateMode.SELECTION,
      });
    }
  }, [confirm]);

  // Calls Figma with an old name and new name and asks it to update all tokens that use the old name
  const remapToken = useCallback(async (oldName: string, newName: string, updateMode?: UpdateMode) => {
    track('remapToken', { fromRename: true });

    postToFigma({
      type: MessageToPluginTypes.REMAP_TOKENS,
      oldName,
      newName,
      updateMode: updateMode || settings.updateMode,
    });
  }, [settings.updateMode]);

  // Calls Figma with all tokens to create styles
  const createStylesFromTokens = useCallback(() => {
    track('createStyles');

    const resolved = resolveTokenValues(mergeTokenGroups(tokens, usedTokenSet));
    const withoutIgnored = resolved.filter((token) => !token.name.split('.').some((part) => part.startsWith('_')));

    postToFigma({
      type: MessageToPluginTypes.CREATE_STYLES,
      tokens: withoutIgnored,
      settings,
    });
  }, [settings, tokens, usedTokenSet]);

  return useMemo(() => ({
    isAlias,
    getTokenValue,
    getFormattedTokens,
    getStringTokens,
    createStylesFromTokens,
    pullStyles,
    remapToken,
    removeTokensByValue,
    handleRemap,
  }), [
    isAlias,
    getTokenValue,
    getFormattedTokens,
    getStringTokens,
    createStylesFromTokens,
    pullStyles,
    remapToken,
    removeTokensByValue,
    handleRemap,
  ]);
}
