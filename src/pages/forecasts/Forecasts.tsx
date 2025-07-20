import { Button, Icon, Tooltip, Typography } from 'lago-design-system'
import { useRef } from 'react'

import { Filters, ForecastsAvailableFilters } from '~/components/designSystem/Filters'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { FORECASTS_FILTER_PREFIX } from '~/core/constants/filters'
import { CurrencyEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PageHeader } from '~/styles'

export const BadgeAI = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center gap-1 rounded-[9px] bg-gradient-to-r from-[#A277E3] to-[#EE4545] px-1.5 py-1">
      <Icon className="text-blue-600" name="sparkles" size="small" />

      <Typography className="text-xs font-medium text-purple-700">
        {translate('text_17530144570404vslv3s1ki3')}
      </Typography>
    </div>
  )
}

const Forecasts = () => {
  const { translate } = useInternationalization()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const hasAccessToForecastsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

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

        <section>
          <Filters.Provider
            filtersNamePrefix={FORECASTS_FILTER_PREFIX}
            staticFilters={{
              currency: defaultCurrency,
            }}
            availableFilters={ForecastsAvailableFilters}
            buttonOpener={({ onClick }) => (
              <Button
                startIcon="filter"
                endIcon={!hasAccessToForecastsFeature ? 'sparkles' : undefined}
                size="small"
                variant="quaternary"
                onClick={(e) => {
                  if (!hasAccessToForecastsFeature) {
                    e.stopPropagation()
                    premiumWarningDialogRef.current?.openDialog()
                  } else {
                    onClick()
                  }
                }}
              >
                {translate('text_66ab42d4ece7e6b7078993ad')}
              </Button>
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Typography variant="subhead1" color="grey700">
                    {translate('text_1753014457040hhkl9fy58wy')}
                  </Typography>

                  <Tooltip
                    placement="top-start"
                    title={translate('text_1747817451282js22pfg16gg')}
                    className="flex"
                  >
                    <Icon name="info-circle" className="text-grey-600" />
                  </Tooltip>
                </div>

                <div>
                  <Button size="small">{translate('text_1753014457040p5ahdkllbpx')}</Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                <Filters.Component />
              </div>
            </div>
          </Filters.Provider>
          GRAPH HORIZONTAL BREAKDOWN
        </section>
      </FullscreenPage.Wrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default Forecasts
