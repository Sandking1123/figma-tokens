import type { Dispatch } from '@/app/store';
import type { StartupMessage } from '@/types/AsyncMessages';
import { identify } from '@/utils/analytics';

export function savePluginDataFactory(dispatch: Dispatch, params: StartupMessage) {
  return async () => {
    const { user } = params;
    if (user) {
      dispatch.userState.setUserId(user.figmaId);
      dispatch.userState.setUserName(user.name);
      dispatch.uiState.setLastOpened(params.lastOpened);
      dispatch.settings.setUISettings(params.settings);
      identify(user);
    } else {
      throw new Error('User not found');
    }
  };
}
