import { LoaderUsageSubscriptionItem } from '~/components/customerPortal/common/SectionLoading'
import { planRenewalDate } from '~/components/customerPortal/utils'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { PlanInterval, SubscriptionForPortalUsageFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UsageSubscriptionItemProps = {
  subscription?: SubscriptionForPortalUsageFragment | null
  applicableTimezone?: TimezoneEnum | null
  loading?: boolean
  children?: React.ReactNode
}

const planIntervalLabel = (interval?: string | null) => {
  if (!interval) return ''

  if (interval === PlanInterval.Weekly) {
    return 'text_1728457056992jfgxzscd70q'
  }

  if (interval === PlanInterval.Monthly) {
    return 'text_1728457056992oc086nxmsdc'
  }

  if (interval === PlanInterval.Quarterly) {
    return 'text_1728457056992k9xfbdt0bgq'
  }

  if (interval === PlanInterval.Yearly) {
    return 'text_17284570569928g0b297xuqf'
  }

  return ''
}

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
  const { translate } = useInternationalization()

  if (!subscription) return null

  if (loading)
    return (
      <div className="flex flex-col gap-1" key={subscription.id}>
        <LoaderUsageSubscriptionItem />
      </div>
    )

  return (
    <div className="flex flex-col gap-1" key={subscription.id}>
      <p className="text-base font-medium text-grey-700">{itemName(subscription)}</p>

      {typeof subscription.plan?.amountCurrency !== 'undefined' && (
        <div className="flex gap-1">
          <p className="text-base font-normal text-grey-700">
            {intlFormatNumber(
              deserializeAmount(
                subscription.plan?.amountCents || 0,
                subscription.plan?.amountCurrency,
              ),
              {
                currencyDisplay: 'symbol',
                currency: subscription.plan?.amountCurrency,
              },
            )}
          </p>

          {subscription?.plan?.interval && (
            <p className="text-base font-normal lowercase text-grey-700">
              {translate(planIntervalLabel(subscription.plan.interval))}
            </p>
          )}
        </div>
      )}

      <p className="text-sm font-normal leading-6 text-grey-600">
        {translate('text_1728377747178bfroky3hn30')}{' '}
        {planRenewalDate({
          currentBillingPeriodEndingAt: subscription.currentBillingPeriodEndingAt,
          applicableTimezone,
        })}
      </p>

      <div>{children}</div>
    </div>
  )
}

export default UsageSubscriptionItem
