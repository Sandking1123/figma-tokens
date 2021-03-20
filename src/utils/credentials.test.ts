import {StorageProviderType} from '../../types/api';
import {removeSingleCredential, updateCredentials} from './credentials';

describe('updateCredentials', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('sets credentials when no credentials existed before', async () => {
        const apiObject = {id: '123', secret: 'foo', name: 'mytokens', provider: StorageProviderType.ARCADE};
        figma.clientStorage.getAsync
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(JSON.stringify([apiObject]));
        await updateCredentials(apiObject);

        expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('apiProviders', JSON.stringify([apiObject]));
    });

    it('updates credentials when there have been existing', async () => {
        const apiArray = [{id: '123', secret: 'abc', name: 'mytokens', provider: StorageProviderType.ARCADE}];
        const newObject = {id: '456', secret: 'foo', name: 'mytokens', provider: StorageProviderType.ARCADE};
        const newArray = [...apiArray, newObject];
        figma.clientStorage.getAsync.mockResolvedValue(JSON.stringify(apiArray));
        await updateCredentials(newObject);
        expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('apiProviders', JSON.stringify(newArray));
    });

    it('merges credentials when there have been existing that match', async () => {
        const apiArray = [{id: '123', secret: 'abc', name: 'mytokens', provider: StorageProviderType.ARCADE}];
        const newObject = {id: '123', secret: 'abc', name: 'my new name', provider: StorageProviderType.ARCADE};
        const newArray = [newObject];
        figma.clientStorage.getAsync.mockResolvedValue(JSON.stringify(apiArray));
        await updateCredentials(newObject);
        expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('apiProviders', JSON.stringify(newArray));
    });
});

describe('removeSingleCredential', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('removes credential if found and only one entry existed', async () => {
        const apiObject = {id: '123', secret: 'foo', name: 'mytokens', provider: StorageProviderType.ARCADE};
        const oldArray = [apiObject];
        figma.clientStorage.getAsync.mockResolvedValue(JSON.stringify(oldArray));
        await removeSingleCredential({secret: apiObject.secret, id: apiObject.id});

        expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('apiProviders', JSON.stringify([]));
    });

    it('removes credential if found and multiple existed', async () => {
        const apiObject = {id: '123', secret: 'foo', name: 'mytokens', provider: StorageProviderType.ARCADE};
        const otherObject = {id: '456', secret: 'bar', name: 'mytokens', provider: StorageProviderType.ARCADE};
        const oldArray = [apiObject, otherObject];
        figma.clientStorage.getAsync.mockResolvedValueOnce(JSON.stringify(oldArray));
        await removeSingleCredential({id: otherObject.id, secret: otherObject.secret});

        expect(figma.clientStorage.setAsync).toHaveBeenCalledWith('apiProviders', JSON.stringify([apiObject]));
    });
});
