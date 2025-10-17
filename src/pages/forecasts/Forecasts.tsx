import { AiBadge, Typography } from 'lago-design-system'
import { useRef } from 'react'

import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ForecastsOverviewSection } from '~/pages/forecasts/ForecastsOverviewSection'
import { PageHeader } from '~/styles'

export const BadgeAI = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center gap-1">
      <AiBadge iconSize={12}>
        <Typography className="mt-px text-xs font-medium text-purple-700">
          {translate('text_17530144570404vslv3s1ki3')}
        </Typography>
      </AiBadge>
    </div>
  )
}

const Forecasts = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1753014457040hxp6wkphkvw')}
        </Typography>
      </PageHeader.Wrapper>

      <FullscreenPage.Wrapper>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Typography variant="headline" color="grey700">
              {translate('text_1753014457040hxp6wkphkvw')}
            </Typography>

            <BadgeAI />
          </div>

          <Typography className="max-w-2xl" variant="body" color="grey600">
            {translate('text_17530144570400ri03obw5mv')}
          </Typography>
        </div>

        <ForecastsOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />
      </FullscreenPage.Wrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default Forecasts
