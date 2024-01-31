import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Accordion, Typography } from '~/components/designSystem'
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
          condition={!!charge.billableMetric.flatGroups?.length}
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

        {/* Group properties */}
        {!!charge?.groupProperties?.length &&
          charge?.groupProperties?.map((group, i) => {
            const associatedFlagGroup = charge?.billableMetric?.flatGroups?.find(
              (flatGroup) => flatGroup.id === group.groupId,
            )

            const groupKey = associatedFlagGroup?.key
            const groupName = associatedFlagGroup?.value

            return (
              <Accordion
                key={`plan-details-charges-section-accordion-${i}`}
                summary={
                  <Typography variant="bodyHl" color="grey700">
                    {group.invoiceDisplayName || (
                      <>
                        <span>{groupKey && `${groupKey} • `}</span>
                        <span>{groupName}</span>
                      </>
                    )}
                  </Typography>
                }
              >
                <PlanDetailsChargeWrapperSwitch
                  currency={currency}
                  chargeModel={charge.chargeModel}
                  values={group.values}
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
