import { FC, useMemo } from 'react'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface UsageThreshold {
  amountCents: string
  recurring: boolean
  thresholdDisplayName?: string | null
}

interface SubscriptionProgressiveBillingTableProps {
  thresholds: UsageThreshold[]
  currency: CurrencyEnum
  name?: string
}

export const SubscriptionProgressiveBillingTable: FC<SubscriptionProgressiveBillingTableProps> = ({
  thresholds,
  currency,
  name = 'progressive-billing-thresholds',
}) => {
  const { translate } = useInternationalization()

  const nonRecurringThresholds = useMemo(() => thresholds.filter((t) => !t.recurring), [thresholds])

  const recurringThreshold = useMemo(() => thresholds.find((t) => t.recurring), [thresholds])

  if (!thresholds.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {nonRecurringThresholds.length > 0 && (
        <DetailsPage.TableDisplay
          name={`${name}-non-recurring`}
          className="[&_tr>td:last-child>div]:inline [&_tr>td:last-child>div]:whitespace-pre [&_tr>td:last-child]:max-w-[100px] [&_tr>td:last-child]:truncate"
          header={[
            '',
            translate('text_1724179887723eh12a0kqbdw'),
            translate('text_17241798877234jhvoho4ci9'),
          ]}
          body={nonRecurringThresholds.map((threshold, i) => [
            i === 0
              ? translate('text_1724179887723hi673zmbvdj')
              : translate('text_1724179887723917j8ezkd9v'),
            intlFormatNumber(deserializeAmount(threshold.amountCents, currency), {
              currency,
            }),
            threshold.thresholdDisplayName || '',
          ])}
        />
      )}

      <DetailsPage.InfoGrid
        grid={[
          {
            label: translate('text_17241798877230y851fdxzqt'),
            value: recurringThreshold
              ? translate('text_65251f46339c650084ce0d57')
              : translate('text_65251f4cd55aeb004e5aa5ef'),
          },
        ]}
      />

      {recurringThreshold && (
        <DetailsPage.TableDisplay
          name={`${name}-recurring`}
          className="[&_tr>td:last-child>div]:inline [&_tr>td:last-child>div]:whitespace-pre [&_tr>td:last-child]:max-w-[100px] [&_tr>td:last-child]:truncate"
          body={[
            [
              translate('text_17241798877230y851fdxzqu'),
              intlFormatNumber(deserializeAmount(recurringThreshold.amountCents, currency), {
                currency,
              }),
              recurringThreshold.thresholdDisplayName || '',
            ],
          ]}
        />
      )}
    </div>
  )
}
