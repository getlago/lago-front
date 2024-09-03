import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Accordion, Typography } from '~/components/designSystem'
import { composeChargeFilterDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import { Charge, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import PlanDetailsChargeWrapperSwitch from './PlanDetailsChargeWrapperSwitch'

interface ChargeWithIndex extends Charge {
  [index: number]: unknown
}

type PlanDetailsChargesSectionAccordionProps = {
  charge: ChargeWithIndex
  currency: CurrencyEnum
}

const PlanDetailsChargesSectionAccordion = ({
  charge,
  currency,
}: PlanDetailsChargesSectionAccordionProps) => {
  const { translate } = useInternationalization()

  return (
    <Container>
      <PaddedChargesWrapper>
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
                />
              </Accordion>
            )
          })}
      </PaddedChargesWrapper>
    </Container>
  )
}

export default PlanDetailsChargesSectionAccordion

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const PaddedChargesWrapper = styled.div`
  padding: 0 ${theme.spacing(4)} ${theme.spacing(4)};
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`
