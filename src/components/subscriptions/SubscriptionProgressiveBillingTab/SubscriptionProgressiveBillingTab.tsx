import { gql } from '@apollo/client'
import { FC, useMemo } from 'react'

import { Card, NavigationTab, TabManagedBy, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { FreemiumBlock } from '~/components/premium/FreemiumBlock'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import {
  SubscriptionForProgressiveBillingTabFragment,
  SubscriptionForUseProgressiveBillingTabFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useSubscriptionProgressiveBillingTab } from './hooks/useSubscriptionProgressiveBillingTab'
import { RecurringThresholdsTable } from './RecurringThresholdsTable'
import { SubscriptionProgressiveBillingTabThresholdsHeader } from './SubscriptionProgressiveBillingTabThresholdsHeader'
import { ThresholdsTable } from './ThresholdsTable'

// Test ID constants
export const PROGRESSIVE_BILLING_TAB_TEST_ID = 'progressive-billing-tab'
export const PROGRESSIVE_BILLING_FREEMIUM_BLOCK_TEST_ID = 'progressive-billing-freemium-block'
export const PROGRESSIVE_BILLING_DISABLED_MESSAGE_TEST_ID = 'progressive-billing-disabled-message'

gql`
  fragment SubscriptionForProgressiveBillingTab on Subscription {
    id
    progressiveBillingDisabled
    usageThresholds {
      id
      recurring
    }
    plan {
      id
      amountCurrency
      usageThresholds {
        id
        recurring
      }
    }

    ...SubscriptionForUseProgressiveBillingTab
  }

  ${SubscriptionForUseProgressiveBillingTabFragmentDoc}
`

interface SubscriptionProgressiveBillingTabProps {
  subscription?: SubscriptionForProgressiveBillingTabFragment | null
  loading: boolean
}

export const SubscriptionProgressiveBillingTab: FC<SubscriptionProgressiveBillingTabProps> = ({
  subscription,
  loading,
}) => {
  const { translate } = useInternationalization()
  const {
    currency,
    hasPremiumIntegration,
    subscriptionThresholds,
    nonRecurringSubscriptionThresholds,
    recurringSubscriptionThresholds,
    nonRecurringPlanThresholds,
    recurringPlanThresholds,
  } = useSubscriptionProgressiveBillingTab({ subscription })

  const tabs = useMemo(() => {
    return [
      {
        title: translate('text_1769712384134peknn5jyojg'),
        hidden: !subscriptionThresholds.length && !subscription?.progressiveBillingDisabled,
        component: (
          <div className="flex flex-col gap-4 p-4">
            {subscription?.progressiveBillingDisabled && (
              <Typography
                data-test={PROGRESSIVE_BILLING_DISABLED_MESSAGE_TEST_ID}
                variant="body"
                color="grey500"
              >
                {translate('text_1769714542183sxbznn2i3v0')}
              </Typography>
            )}
            {!subscription?.progressiveBillingDisabled && (
              <>
                <ThresholdsTable
                  thresholds={nonRecurringSubscriptionThresholds}
                  currency={currency}
                />

                {recurringSubscriptionThresholds.length > 0 && (
                  <RecurringThresholdsTable
                    thresholds={recurringSubscriptionThresholds}
                    currency={currency}
                  />
                )}
              </>
            )}
          </div>
        ),
      },
      {
        title: translate('text_17697123841349drggrw2qur'),
        component: (
          <div className="flex flex-col gap-4 p-4">
            <ThresholdsTable thresholds={nonRecurringPlanThresholds} currency={currency} />

            {recurringPlanThresholds.length > 0 && (
              <RecurringThresholdsTable thresholds={recurringPlanThresholds} currency={currency} />
            )}
          </div>
        ),
      },
    ]
  }, [
    translate,
    subscription,
    subscriptionThresholds.length,
    nonRecurringSubscriptionThresholds,
    recurringSubscriptionThresholds,
    nonRecurringPlanThresholds,
    recurringPlanThresholds,
    currency,
  ])

  if (loading && !subscription) {
    return <DetailsPage.Skeleton />
  }

  return (
    <section data-test={PROGRESSIVE_BILLING_TAB_TEST_ID} className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="subhead1">{translate('text_1724179887722baucvj7bvc1')}</Typography>
          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
          />
        </div>

        {!hasPremiumIntegration && (
          <FreemiumBlock
            data-test={PROGRESSIVE_BILLING_FREEMIUM_BLOCK_TEST_ID}
            translationKeys={{
              title: 'text_1724345142892pcnx5m2k3r2',
              description: 'text_1724345142892ljzi79afhmc',
              emailSubject: 'text_172434514289283gmf8bdhh3',
              emailBody: 'text_1724346450317iqs2rtvx1tp',
            }}
          />
        )}

        {hasPremiumIntegration && (
          <Card className="w-full gap-0 p-0">
            <SubscriptionProgressiveBillingTabThresholdsHeader subscription={subscription} />

            <NavigationTab
              // Margin top is here to respect the design implementation. Setting a different height on the navigation tab breaks the selected tab indicator. Using margin was the easiest approach.
              className="mt-1 px-4"
              managedBy={TabManagedBy.INDEX}
              tabs={tabs}
            />
          </Card>
        )}
      </div>
    </section>
  )
}
