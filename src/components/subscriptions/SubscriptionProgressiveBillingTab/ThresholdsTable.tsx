import { gql } from '@apollo/client/core'
import { useId } from 'react'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, ThresholdForThresholdsTableFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ThresholdForThresholdsTable on UsageThreshold {
    id
    amountCents
    recurring
    thresholdDisplayName
  }
`

export const ThresholdsTable = ({
  thresholds,
  currency,
}: {
  thresholds: ThresholdForThresholdsTableFragment[]
  currency: CurrencyEnum
}) => {
  const id = useId()
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name={`thresholds-table-${id.replace(/:/g, '')}`}
      className="[&_tr>td:last-child>div]:inline [&_tr>td:last-child>div]:whitespace-pre [&_tr>td:last-child]:max-w-[100px] [&_tr>td:last-child]:truncate"
      header={[
        '',
        translate('text_1724179887723eh12a0kqbdw'),
        translate('text_17241798877234jhvoho4ci9'),
      ]}
      body={[
        ...(thresholds
          ?.filter((t) => !t.recurring)
          .map((threshold, i) => [
            i === 0
              ? translate('text_1724179887723hi673zmbvdj')
              : translate('text_1724179887723917j8ezkd9v'),
            intlFormatNumber(deserializeAmount(threshold.amountCents, currency), {
              currency,
            }),
            threshold.thresholdDisplayName || '',
          ]) || []),
      ]}
    />
  )
}
