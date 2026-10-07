import { ReactNode } from 'react'

import { ButtonSelector } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AUTO_REFRESH_OPTIONS, WINDOWS } from './constants'
import { RealtimeUsageState } from './types'

export const REALTIME_USAGE_CONTROL_CLASSNAME = 'flex-row items-center gap-2'

type RealtimeUsageControlsProps = {
  state: RealtimeUsageState
  testIdPrefix: string
  children?: ReactNode
}

// Charge selection on the left, view-specific controls then window and
// polling on the right. Both views take the same decisions in the same
// place, so switching between them below the fold is not a relearn.
export const RealtimeUsageControls = ({
  state,
  testIdPrefix,
  children,
}: RealtimeUsageControlsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3">
      {state.charges.length > 1 && (
        <ButtonSelector
          data-test={`${testIdPrefix}-charges`}
          options={state.charges.map((charge) => ({
            value: charge.id,
            label: charge.invoiceDisplayName || charge.billableMetric.name,
          }))}
          value={state.selectedCharge?.id}
          onChange={(value) => state.setChargeId(String(value))}
        />
      )}

      <div className="ml-auto flex flex-row flex-wrap items-center gap-x-5 gap-y-2">
        {children}

        <ButtonSelector
          data-test={`${testIdPrefix}-time-range`}
          className={REALTIME_USAGE_CONTROL_CLASSNAME}
          label={translate('text_1787610177631jhuc7lxfw1v')}
          options={WINDOWS.map(({ hours }) => ({ value: hours, label: `${hours}h` }))}
          value={state.windowInHours}
          onChange={(value) => state.changeWindow(Number(value))}
        />

        <ButtonSelector
          data-test={`${testIdPrefix}-auto-refresh`}
          className={REALTIME_USAGE_CONTROL_CLASSNAME}
          label={translate('text_17876098439600jp8nt3z0hk')}
          options={AUTO_REFRESH_OPTIONS.map((value) => ({
            value,
            label: value === 0 ? translate('text_1787609843960bopfeje8bho') : `${value}s`,
          }))}
          value={state.autoRefreshSeconds}
          onChange={(value) => state.setAutoRefreshSeconds(Number(value))}
        />
      </div>
    </div>
  )
}
