import { Stack } from '@mui/material'

import { Accordion, Typography } from '~/components/designSystem'
import { mapChargeIntervalCopy } from '~/components/plans/ChargeAccordion'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, EditPlanFragment, PlanInterval } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DetailsInfoGrid } from '~/styles/detailsPage'

import DetailsTableDisplay from '../../details/DetailsTableDisplay'

const PlanDetailsCommitmentsSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()

  return (
    <Stack direction="column" spacing={6}>
      <div>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_65d601bffb11e0f9d1d9f569')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_6661fc17337de3591e29e451', {
            interval: translate(
              mapChargeIntervalCopy(plan?.interval ?? PlanInterval.Monthly, false),
            ).toLocaleLowerCase(),
          })}
        </Typography>
      </div>

      <Accordion
        summary={
          <Typography variant="bodyHl" color="grey700">
            {plan?.minimumCommitment?.invoiceDisplayName ||
              translate('text_65d601bffb11e0f9d1d9f569')}
          </Typography>
        }
      >
        <Stack direction="column" spacing={4}>
          <DetailsTableDisplay
            header={[translate('text_65d601bffb11e0f9d1d9f571')]}
            body={[
              [
                intlFormatNumber(
                  deserializeAmount(
                    plan?.minimumCommitment?.amountCents || 0,
                    plan?.amountCurrency || CurrencyEnum.Usd,
                  ),
                  {
                    currency: currency,
                  },
                ),
              ],
            ]}
          />

          <DetailsInfoGrid
            grid={[
              {
                label: translate('text_65201b8216455901fe273dc1'),
                value: translate(getIntervalTranslationKey[plan?.interval as PlanInterval]),
              },
              {
                label: translate('text_645bb193927b375079d28a8f'),
                value: !!plan?.minimumCommitment?.taxes?.length
                  ? plan?.minimumCommitment?.taxes?.map((tax, i) => (
                      <Typography
                        key={`plan-details-fixed-fee-taxe-${i}`}
                        variant="body"
                        color="grey700"
                      >
                        {tax.name} (
                        {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                          maximumFractionDigits: 2,
                          style: 'percent',
                        })}
                        )
                      </Typography>
                    ))
                  : '-',
              },
            ]}
          />
        </Stack>
      </Accordion>
    </Stack>
  )
}

export default PlanDetailsCommitmentsSection
