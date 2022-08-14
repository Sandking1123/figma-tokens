import React from 'react';
import useTokens from '@/app/store/useTokens';
import Heading from '../Heading';
import Textarea from '../Textarea';
import Button from '../Button';
import Checkbox from '../Checkbox';
import Label from '../Label';
import Box from '../Box';
import Stack from '../Stack';
import { track } from '@/utils/analytics';

type Props = {
  onClose: () => void
};

export default function SingleFileExport({ onClose }: Props) {
  const { getFormattedTokens } = useTokens();
  const [includeAllTokens, setIncludeAllTokens] = React.useState(false);
  const [includeParent, setIncludeParent] = React.useState(true);
  const [expandTypography, setExpandTypography] = React.useState(false);
  const [expandShadow, setExpandShadow] = React.useState(false);
  const [expandComposition, setExpandComposition] = React.useState(false);

  const handleToggleIncludeAllTokens = React.useCallback(() => {
    setIncludeAllTokens(!includeAllTokens);
  }, [includeAllTokens]);

  const handleToggleIncludeParent = React.useCallback(() => {
    setIncludeParent(!includeParent);
  }, [includeParent]);

  const handleToggleExpandTypograhy = React.useCallback(() => {
    setExpandTypography(!expandTypography);
  }, [expandTypography]);

  const handleToggleExpandShadow = React.useCallback(() => {
    setExpandShadow(!expandShadow);
  }, [expandShadow]);

  const handleToggleExpandComposition = React.useCallback(() => {
    setExpandComposition(!expandComposition);
  }, [expandComposition]);

  const handleClickExport = React.useCallback(() => {
    track('Export file', {
      includeParent, includeAllTokens, expandComposition, expandShadow, expandTypography,
    });
  }, [expandComposition, expandShadow, expandTypography, includeAllTokens, includeParent]);

  const formattedTokens = React.useMemo(() => getFormattedTokens({
    includeAllTokens, includeParent, expandTypography, expandShadow, expandComposition,
  }), [includeAllTokens, includeParent, expandTypography, expandShadow, expandComposition, getFormattedTokens]);

  return (
    <Stack gap={4} direction="column">
      <Box css={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Box css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Checkbox
            id="includeAllTokens"
            checked={includeAllTokens}
            defaultChecked={includeAllTokens}
            onCheckedChange={handleToggleIncludeAllTokens}
          />
          <Label htmlFor="includeAllTokens">All token sets</Label>
        </Box>
        <Box css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Checkbox
            disabled={includeAllTokens}
            id="includeParent"
            checked={includeParent}
            defaultChecked={includeParent}
            onCheckedChange={handleToggleIncludeParent}
          />
          <Label disabled={includeAllTokens} htmlFor="includeParent">
            Include parent key
          </Label>
        </Box>
        <Heading size="medium">Options</Heading>
        <Box css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Checkbox
            id="expandTypography"
            checked={expandTypography}
            defaultChecked={expandTypography}
            onCheckedChange={handleToggleExpandTypograhy}
          />
          <Label htmlFor="expandTypography">Expand Typography</Label>
        </Box>
        <Box css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Checkbox
            id="expandShadow"
            checked={expandShadow}
            defaultChecked={expandShadow}
            onCheckedChange={handleToggleExpandShadow}
          />
          <Label htmlFor="expandShadow">Expand Shadows</Label>
        </Box>
        <Box css={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Checkbox
            id="expandComposition"
            checked={expandComposition}
            defaultChecked={expandComposition}
            onCheckedChange={handleToggleExpandComposition}
          />
          <Label htmlFor="expandComposition">Expand Composition</Label>
        </Box>
      </Box>
      <Heading size="medium">Preview</Heading>
      <Textarea
        rows={10}
        isDisabled
        value={formattedTokens}
      />
      <Stack width="full" direction="row" justify="end" gap={4}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          href={`data:text/json;charset=utf-8,${encodeURIComponent(formattedTokens)}`}
          download="tokens.json"
          variant="primary"
          onClick={handleClickExport}
        >
          Export
        </Button>
      </Stack>
    </Stack>
  );
}
