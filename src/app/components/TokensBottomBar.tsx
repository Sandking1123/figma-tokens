import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApplySelector from './ApplySelector';
import ExportModal from './modals/ExportModal';
import PresetModal from './modals/PresetModal';
import Box from './Box';
import ActionButton from './ActionButton';
import StylesDropdown from './StylesDropdown';

export default function TokensBottomBar({ handleUpdate }: { handleUpdate: () => void }) {
  const { editProhibited } = useSelector((state: RootState) => state.tokenState);

  const [exportModalVisible, showExportModal] = React.useState(false);
  const [presetModalVisible, showPresetModal] = React.useState(false);

  return (
    <Box css={{
      width: '100%', backgroundColor: '$bgDefault', borderBottom: '1px solid', borderColor: '$borderMuted',
    }}
    >
      <Box css={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', gap: '$2', padding: '$3 $4',
      }}
      >
        <ApplySelector />
        <Box css={{ display: 'flex', flexDirection: 'row', gap: '$2' }}>
          <ActionButton text="Load" disabled={editProhibited} onClick={() => showPresetModal(true)} />
          <ActionButton text="Export" onClick={() => showExportModal(true)} />
          <StylesDropdown />
          <ActionButton text="Update" variant="primary" onClick={handleUpdate} />
        </Box>
      </Box>
      {exportModalVisible && <ExportModal onClose={() => showExportModal(false)} />}
      {presetModalVisible && <PresetModal onClose={() => showPresetModal(false)} />}

    </Box>
  );
}
