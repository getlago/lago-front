import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import {
  AUTO_REFRESH_TRANSLATIONS,
  AutoRefreshEnum,
  REALTIME_USAGE_AUTO_REFRESH_TEST_ID,
} from './constants'
import { useRealtimeUsageControls } from './useRealtimeUsageControls'

export const RealtimeUsageAutoRefreshSelector = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { autoRefresh, setAutoRefresh } = useRealtimeUsageControls()

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      opener={
        <Button
          data-test={REALTIME_USAGE_AUTO_REFRESH_TEST_ID}
          variant="secondary"
          size="small"
          startIcon="reload"
          endIcon="chevron-down"
        >
          {`${translate('text_17925005807279vz8l13j3bs')}: ${translate(AUTO_REFRESH_TRANSLATIONS[autoRefresh])}`}
        </Button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper>
          {Object.values(AutoRefreshEnum).map((option) => (
            <Button
              key={`realtime-usage-auto-refresh-${option}`}
              variant="quaternary"
              align="space-between"
              endIcon={option === autoRefresh ? 'checkmark' : undefined}
              onClick={() => {
                setAutoRefresh(option)
                closePopper()
              }}
            >
              {translate(AUTO_REFRESH_TRANSLATIONS[option])}
            </Button>
          ))}
        </MenuPopper>
      )}
    </Popper>
  )
}
