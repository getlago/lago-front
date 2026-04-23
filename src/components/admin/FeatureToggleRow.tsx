import NiceModal from '@ebay/nice-modal-react'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'

import { Typography } from '~/components/designSystem/Typography'

import { REASON_MODAL_NAME } from './const'
import { ReasonModalProps } from './ReasonModal'

export interface FeatureToggleRowProps {
  featureKey: string
  featureType: 'premium_integration' | 'feature_flag'
  enabled: boolean
  onToggle: (reason: string, notifyOrgAdmin: boolean) => void | Promise<void>
}

const TYPE_LABEL: Record<FeatureToggleRowProps['featureType'], string> = {
  premium_integration: 'Premium Integration',
  feature_flag: 'Feature Flag',
}

export const FeatureToggleRow = ({
  featureKey,
  featureType,
  enabled,
  onToggle,
}: FeatureToggleRowProps) => {
  const handleSwitchClick = () => {
    const action = enabled ? 'Disable' : 'Enable'
    const label = featureKey.replace(/_/g, ' ')

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: `${action} ${label}`,
      description: `Please provide a reason for ${action.toLowerCase()}ing "${featureKey}".`,
      onConfirm: onToggle,
    })
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="body">{featureKey}</Typography>
        <Typography variant="caption" color="grey600">
          {TYPE_LABEL[featureType]}
        </Typography>
      </Box>
      <Switch checked={enabled} onChange={handleSwitchClick} color="primary" />
    </Box>
  )
}

export default FeatureToggleRow
