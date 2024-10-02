import { planRenewalDate } from '~/components/customerPortal/utils'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { SubscriptionForPortalUsageFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UsageSubscriptionItemProps = {
  subscription?: SubscriptionForPortalUsageFragment | null
  children?: React.ReactNode
  applicableTimezone?: TimezoneEnum | null
}

const UsageSubscriptionItem = ({
  subscription,
  applicableTimezone,
  children,
}: UsageSubscriptionItemProps) => {
  const { translate } = useInternationalization()

  if (!subscription) return null

  return (
    <div key={subscription.id}>
      <p className="text-base font-medium text-grey-700">{subscription.plan?.name}</p>

      <p className="text-base font-normal text-grey-700">
        {typeof subscription.plan?.amountCurrency !== 'undefined' && (
          <>
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
          </>
        )}
      </p>

      <p className="text-sm font-normal text-grey-600">
        {translate('TODO: Your plan renews on')}{' '}
        {planRenewalDate({
          currentBillingPeriodEndingAt: subscription.currentBillingPeriodEndingAt,
          applicableTimezone,
        })}
      </p>

      {children}
    </div>
  )
}

export default UsageSubscriptionItem
