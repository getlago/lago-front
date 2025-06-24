import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Accordion, Typography } from '~/components/designSystem'
import { composeChargeFilterDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import { Charge, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanDetailsChargeWrapperSwitch } from './PlanDetailsChargeWrapperSwitch'

interface ChargeWithIndex extends Charge {
  [index: number]: unknown
}

type PlanDetailsChargesSectionAccordionProps = {
  charge: ChargeWithIndex
  currency: CurrencyEnum
}

export const PlanDetailsChargesSectionAccordion = ({
  charge,
  currency,
}: PlanDetailsChargesSectionAccordionProps) => {
  const { translate } = useInternationalization()

  return (
    <section className="flex flex-col gap-4 px-4 pb-4 shadow-b">
      {/* Default properties */}
      <ConditionalWrapper
        condition={!!charge?.billableMetric?.filters?.length}
        invalidWrapper={(children) => <div>{children}</div>}
        validWrapper={(children) => (
          <Accordion
            summary={
              <Typography variant="bodyHl" color="grey700">
                {translate('text_64e620bca31226337ffc62ad')}
              </Typography>
            }
          >
            {children}
          </Accordion>
        )}
      >
        <PlanDetailsChargeWrapperSwitch
          currency={currency}
          chargeModel={charge.chargeModel}
          values={charge.properties}
          chargeAppliedPricingUnit={charge.appliedPricingUnit}
        />
      </ConditionalWrapper>

      {/* filter details */}
      {!!charge?.filters?.length &&
        charge?.filters?.map((filter, i) => {
          const accordionMappedDisplayValues = composeChargeFilterDisplayName(filter)

          return (
            <Accordion
              key={`plan-details-charges-section-accordion-${i}`}
              summary={
                <Typography noWrap variant="bodyHl" color="grey700">
                  {filter.invoiceDisplayName || accordionMappedDisplayValues}
                </Typography>
              }
            >
              <PlanDetailsChargeWrapperSwitch
                currency={currency}
                chargeModel={charge.chargeModel}
                values={filter.properties}
                chargeAppliedPricingUnit={charge.appliedPricingUnit}
              />
            </Accordion>
          )
        })}
    </section>
  )
}
