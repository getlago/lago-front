import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { BILLING_ENTITY_ROUTE } from '~/core/router/SettingRoutes'
import { BillingEntity } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  BILLING_ENTITY_SETTINGS_TABS_LABELS,
  BillingEntityTab,
} from '~/pages/settings/BillingEntity/BillingEntity'

type BillingEntityHeaderProps = {
  billingEntity?: BillingEntity | null
  tab?: BillingEntityTab
  customLabel?: string
  action?: React.ReactNode
  loading?: boolean
  customBackPath?: string
}

const BillingEntityHeader = ({
  billingEntity,
  tab,
  customLabel,
  action,
  loading,
  customBackPath,
}: BillingEntityHeaderProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  const billingEntityCode = billingEntity?.code

  const hasTab = typeof tab !== 'undefined'

  const tabLabel = hasTab
    ? ` / ${translate(BILLING_ENTITY_SETTINGS_TABS_LABELS[tab as BillingEntityTab])}`
    : ''

  const defaultLabel = `${billingEntity?.name}${tabLabel}`

  const label = customLabel || defaultLabel || ''

  if (loading) {
    return (
      <PageBannerHeaderWithBurgerMenu>
        <Skeleton variant="text" className="w-70" />
      </PageBannerHeaderWithBurgerMenu>
    )
  }

  return (
    <PageBannerHeaderWithBurgerMenu>
      <div className="flex items-center gap-2">
        {hasTab && (
          <Button
            variant="quaternary"
            icon="arrow-left"
            onClick={() => {
              if (billingEntityCode) {
                navigate(
                  generatePath(customBackPath ?? BILLING_ENTITY_ROUTE, {
                    billingEntityCode,
                  }),
                )
              }
            }}
          />
        )}

        <Typography variant="bodyHl" color="grey700">
          {label}
        </Typography>
      </div>

      {action && <>{action}</>}
    </PageBannerHeaderWithBurgerMenu>
  )
}

export default BillingEntityHeader
