import { LoaderUsageSubscriptionItem } from '~/components/customerPortal/common/SectionLoading'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { planRenewalDate } from '~/components/customerPortal/utils'
import { Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { PlanInterval, SubscriptionForPortalUsageFragment, TimezoneEnum } from '~/generated/graphql'

type UsageSubscriptionItemProps = {
  subscription?: SubscriptionForPortalUsageFragment | null
  applicableTimezone?: TimezoneEnum | null
  loading?: boolean
  children?: React.ReactNode
}

const TRANSLATIONS_MAP_PLAN_INTERVAL = {
  [PlanInterval.Weekly]: 'text_1728457056992jfgxzscd70q',
  [PlanInterval.Monthly]: 'text_1728457056992oc086nxmsdc',
  [PlanInterval.Quarterly]: 'text_1728457056992k9xfbdt0bgq',
  [PlanInterval.Yearly]: 'text_17284570569928g0b297xuqf',
}

const planIntervalLabel = (interval: PlanInterval) => TRANSLATIONS_MAP_PLAN_INTERVAL[interval]

const itemName = (subscription: SubscriptionForPortalUsageFragment) => {
  if (subscription?.name) {
    return subscription.name
  }

  if (subscription?.plan?.invoiceDisplayName) {
    return subscription.plan.invoiceDisplayName
  }

  if (subscription?.plan?.name) {
    return subscription.plan.name
  }

  return ''
}

const UsageSubscriptionItem = ({
  subscription,
  applicableTimezone,
  loading,
  children,
}: UsageSubscriptionItemProps) => {
  const { translate, documentLocale } = useCustomerPortalTranslate()

  if (loading)
    return (
      <div className="flex flex-col gap-1">
        <LoaderUsageSubscriptionItem />
      </div>
    )

  if (!subscription) return null

  return (
    <div className="flex flex-col gap-1" key={subscription.id}>
      <Typography className="text-base font-medium text-grey-700">
        {itemName(subscription)}
      </Typography>

      {typeof subscription.plan?.amountCurrency !== 'undefined' && (
        <div className="flex gap-1">
          <Typography className="text-base font-normal text-grey-700">
            {translate('text_17326262367759e7w9yfbeno', {
              amount: intlFormatNumber(
                deserializeAmount(
                  subscription.plan?.amountCents || 0,
                  subscription.plan?.amountCurrency,
                ),
                {
                  currencyDisplay: 'narrowSymbol',
                  currency: subscription.plan?.amountCurrency,
                  locale: documentLocale,
                },
              ),
            })}
          </Typography>

          {subscription?.plan?.interval && (
            <Typography className="text-base font-normal lowercase text-grey-700">
              {translate(planIntervalLabel(subscription.plan.interval))}
            </Typography>
          )}
        </div>
      )}

      <Typography className="text-sm font-normal leading-6 text-grey-600">
        {translate('text_1728377747178bfroky3hn30', {
          date: planRenewalDate({
            currentBillingPeriodEndingAt: subscription.currentBillingPeriodEndingAt,
            applicableTimezone,
            locale: documentLocale,
          }),
        })}
      </Typography>

      <div>{children}</div>
    </div>
  )
}

export default UsageSubscriptionItem
