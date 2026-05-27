import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import { UsageChargeInfo, UsageChargeInfoCharge } from '~/components/plans/UsageChargeInfo'
import { CurrencyEnum, EditPlanFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PlanDetailsUsageChargesSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  const { translate } = useInternationalization()
  const { meteredCharges, recurringCharges } =
    plan?.charges?.reduce(
      (acc, charge) => {
        if (!charge.billableMetric.recurring) {
          acc?.meteredCharges?.push(charge)
        } else {
          acc?.recurringCharges?.push(charge)
        }
        return acc
      },
      { meteredCharges: [], recurringCharges: [] } as {
        meteredCharges: EditPlanFragment['charges']
        recurringCharges: EditPlanFragment['charges']
      },
    ) ?? {}

  return (
    <section className="flex flex-col gap-12">
      {!!meteredCharges?.length && (
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_64d2713ec021c6005ef64e03')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_64d2715f868d50004c21fee8')}
            </Typography>
          </div>
          {meteredCharges.map((charge, i) => (
            <Accordion
              noContentMargin
              key={`plan-details_charges-section_metered-charge-${i}`}
              summary={
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {charge.invoiceDisplayName || charge.billableMetric.name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {charge.billableMetric.code}
                  </Typography>
                </div>
              }
            >
              <UsageChargeInfo
                charge={charge as UsageChargeInfoCharge}
                currency={currency}
                planInterval={plan?.interval}
                billChargesMonthly={plan?.billChargesMonthly}
                planTaxes={plan?.taxes}
              />
            </Accordion>
          ))}
        </div>
      )}
      {!!recurringCharges?.length && (
        <div className="flex flex-col gap-6">
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_64d271e20a9c11005bd6688a')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_64d2720f666bf7007e9ca759')}
            </Typography>
          </div>
          {recurringCharges.map((charge, i) => (
            <Accordion
              noContentMargin
              key={`plan-details_charges-section_recurring-charge-${i}`}
              summary={
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {charge.invoiceDisplayName || charge.billableMetric.name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {charge.billableMetric.code}
                  </Typography>
                </div>
              }
            >
              <UsageChargeInfo
                charge={charge as UsageChargeInfoCharge}
                currency={currency}
                planInterval={plan?.interval}
                billChargesMonthly={plan?.billChargesMonthly}
                planTaxes={plan?.taxes}
              />
            </Accordion>
          ))}
        </div>
      )}
    </section>
  )
}
