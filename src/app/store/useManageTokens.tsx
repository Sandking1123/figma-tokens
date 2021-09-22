import {useDispatch} from 'react-redux';
import {SingleToken, TokenType} from '@types/tokens';
import {Dispatch} from '../store';
import useConfirm from '../hooks/useConfirm';

export default function useManageTokens() {
    const {editToken, createToken, deleteToken} = useDispatch<Dispatch>().tokenState;
    const dispatch = useDispatch<Dispatch>();
    const {confirm} = useConfirm();

    async function editSingleToken(data: {
        parent: string;
        name: string;
        value: SingleToken;
        options?: {description?: string; type: TokenType};
        oldName?: string;
        shouldUpdateDocument?: boolean;
    }) {
        const {parent, name, value, options, oldName, shouldUpdateDocument = true} = data;
        dispatch.uiState.setLoading(true);

        // should be a setting which users can toggle on / off to disable auto-sync after each token change
        const shouldUpdate = true;

        if (shouldUpdate) {
            editToken({
                parent,
                name,
                value,
                options,
                oldName,
                shouldUpdate: shouldUpdateDocument,
            });
        }
        dispatch.uiState.setLoading(false);
    }

    async function createSingleToken(data: {
        parent: string;
        name: string;
        value: SingleToken;
        options?: {description?: string; type: TokenType};
        newGroup?: boolean;
        shouldUpdateDocument?: boolean;
    }) {
        const {parent, name, value, options, newGroup = false, shouldUpdateDocument = true} = data;
        dispatch.uiState.setLoading(true);
        // should be a setting which users can toggle on / off to disable auto-sync after each token change
        const shouldUpdate = true;

        if (shouldUpdate) {
            createToken({
                parent,
                name,
                value,
                options,
                newGroup,
                shouldUpdate: shouldUpdateDocument,
            });
        }
        dispatch.uiState.setLoading(false);
    }

    async function deleteSingleToken(data) {
        const userConfirmation = await confirm({
            text: 'Delete token?',
            description: 'Are you sure you want to delete this token?',
        });
        if (userConfirmation) {
            dispatch.uiState.setLoading(true);
            deleteToken(data);
            dispatch.uiState.setLoading(false);
        }
    }

    return {editSingleToken, createSingleToken, deleteSingleToken};
}
