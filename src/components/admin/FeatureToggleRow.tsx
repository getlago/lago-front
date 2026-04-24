import NiceModal from '@ebay/nice-modal-react'
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
    <div className="flex items-center justify-between border-b border-grey-300 py-3">
      <div className="flex flex-col gap-0.5">
        <Typography variant="body">{featureKey}</Typography>
        <Typography variant="caption" color="grey600">
          {TYPE_LABEL[featureType]}
        </Typography>
      </div>
      <Switch checked={enabled} onChange={handleSwitchClick} color="primary" />
    </div>
  )
}

export default FeatureToggleRow
