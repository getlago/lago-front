import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Accordion, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { Charge, CurrencyEnum, EditPlanFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem } from '~/styles/detailsPage'

import PlanDetailsChargeWrapperSwitch from './PlanDetailsChargeWrapperSwitch'

interface ChargeWithIndex extends Charge {
  [index: number]: unknown
}

type PlanDetailsChargesSectionAccordionProps = {
  charge: ChargeWithIndex
  currency: CurrencyEnum
  planTaxes?: EditPlanFragment['taxes']
}

const PlanDetailsChargesSectionAccordion = ({
  charge,
  currency,
  planTaxes,
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
              (flatGroup) => flatGroup.id === group.groupId
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

      {/* Display options */}
      <PaddedOptionsWrapper>
        <DetailsInfoGrid>
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273dd9')}
            value={
              charge?.payInAdvance
                ? translate('text_646e2d0cc536351b62ba6faa')
                : translate('text_646e2d0cc536351b62ba6f8c')
            }
          />
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273ddb')}
            value={intlFormatNumber(deserializeAmount(charge.minAmountCents, currency), {
              currencyDisplay: 'symbol',
              currency,
              maximumFractionDigits: 15,
            })}
          />
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273df0')}
            value={
              charge.prorated
                ? translate('text_65251f46339c650084ce0d57')
                : translate('text_65251f4cd55aeb004e5aa5ef')
            }
          />
          <DetailsInfoItem
            label={translate('text_646e2d0cc536351b62ba6f16')}
            value={
              charge.invoiceable
                ? translate('text_65251f46339c650084ce0d57')
                : translate('text_65251f4cd55aeb004e5aa5ef')
            }
          />
          <DetailsInfoItem
            label={translate('text_645bb193927b375079d28a8f')}
            value={
              !!charge?.taxes?.length || !!planTaxes?.length
                ? (charge.taxes?.length ? charge.taxes : planTaxes)?.map((tax, i) => (
                    <div key={`plan-details-charges-section-accordion-tax-${i}`}>
                      {tax.name} (
                      {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                        maximumFractionDigits: 2,
                        style: 'percent',
                      })}
                      )
                    </div>
                  ))
                : '-'
            }
          />
        </DetailsInfoGrid>
      </PaddedOptionsWrapper>
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

const PaddedOptionsWrapper = styled.div`
  padding: 0 ${theme.spacing(4)} ${theme.spacing(4)};
  box-sizing: border-box;
`
