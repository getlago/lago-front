import { Accordion } from '~/components/designSystem/Accordion'
import { Typography } from '~/components/designSystem/Typography'
import { FixedChargeInfo } from '~/components/plans/FixedChargeInfo'
import { CurrencyEnum, EditPlanFragment } from '~/generated/graphql'

export const PlanDetailsFixedChargesSection = ({
  currency,
  plan,
}: {
  currency: CurrencyEnum
  plan?: EditPlanFragment | null
}) => {
  return (
    <div className="flex flex-col gap-6">
      {plan?.fixedCharges?.map((fixedCharge, i) => (
        <Accordion
          noContentMargin
          key={`plan-details_fixed-charges-section_fixed-charge-${i}`}
          summary={
            <div>
              <Typography variant="bodyHl" color="grey700">
                {fixedCharge.invoiceDisplayName || fixedCharge.addOn.name}
              </Typography>
              <Typography variant="caption" noWrap>
                {fixedCharge.addOn.code}
              </Typography>
            </div>
          }
        >
          <FixedChargeInfo
            fixedCharge={fixedCharge}
            currency={currency}
            planInterval={plan?.interval}
            billFixedChargesMonthly={plan?.billFixedChargesMonthly}
            planTaxes={plan?.taxes}
          />
        </Accordion>
      ))}
    </div>
  )
}
