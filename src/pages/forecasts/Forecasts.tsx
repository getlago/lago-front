import { Icon, Typography } from 'lago-design-system'
import { useRef } from 'react'

import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ForecastsOverviewSection } from '~/pages/forecasts/ForecastsOverviewSection'
import { PageHeader } from '~/styles'

export const BadgeAI = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center gap-1 rounded-[9px] bg-[linear-gradient(0deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.9)_100%),linear-gradient(268deg,#A277E3_2.81%,#EE4545_90.17%)] px-1.5 py-1">
      <Icon className="text-blue-600" name="sparkles" size="small" />

      <Typography className="text-xs font-medium text-purple-700">
        {translate('text_17530144570404vslv3s1ki3')}
      </Typography>
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

          <Typography variant="body" color="grey600">
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
