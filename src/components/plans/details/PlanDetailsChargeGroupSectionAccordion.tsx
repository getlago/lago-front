import styled from 'styled-components'

import { Accordion, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { Charge, ChargeGroup, ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem } from '~/styles/detailsPage'

import PlanDetailsChargeGroupChildSectionAccordion from './PlanDetailsChargeGroupChildSectionAccordion'
import PlanDetailsChargeWrapperSwitch from './PlanDetailsChargeWrapperSwitch'

type PlanDetailsChargeGroupSectionAccordionProps = {
  chargesArray: Charge[]
  chargeGroup: ChargeGroup
  currency: CurrencyEnum
}

const PlanDetailsChargeGroupSectionAccordion = ({
  chargesArray,
  chargeGroup,
  currency,
}: PlanDetailsChargeGroupSectionAccordionProps) => {
  const { translate } = useInternationalization()

  return (
    <Container>
      <PaddedChargesWrapper>
        <PlanDetailsChargeWrapperSwitch
          currency={currency}
          chargeModel={ChargeModelEnum.PackageGroup}
          groupValues={chargeGroup.properties}
        />
      </PaddedChargesWrapper>

      <PaddedChargesWrapper>
        {chargesArray.map((charge, i) => (
          <Accordion
            noContentMargin
            key={`plan-details_charges-section_group-charge-${i}`}
            summary={
              <ChargeSummaryWrapper>
                <Typography variant="bodyHl" color="grey700">
                  {charge.invoiceDisplayName || charge.billableMetric.name}
                </Typography>
                <Typography variant="caption" noWrap>
                  {charge.billableMetric.code}
                </Typography>
              </ChargeSummaryWrapper>
            }
          >
            <ChargeSectionWrapper>
              <PlanDetailsChargeGroupChildSectionAccordion
                currency={currency}
                charge={charge as Charge}
              />
            </ChargeSectionWrapper>
          </Accordion>
        ))}
      </PaddedChargesWrapper>

      {/* Display options */}
      <PaddedOptionsWrapper>
        <DetailsInfoGrid>
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273dd9')}
            value={
              chargeGroup?.payInAdvance
                ? translate('text_646e2d0cc536351b62ba6faa')
                : translate('text_646e2d0cc536351b62ba6f8c')
            }
          />
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273ddb')}
            value={intlFormatNumber(deserializeAmount(chargeGroup.minAmountCents, currency), {
              currencyDisplay: 'symbol',
              currency,
              maximumFractionDigits: 15,
            })}
          />
          <DetailsInfoItem
            label={translate('text_65201b8216455901fe273df0')}
            value={
              // No proporated on charge group
              translate('text_65251f4cd55aeb004e5aa5ef')
            }
          />
          <DetailsInfoItem
            label={translate('text_646e2d0cc536351b62ba6f16')}
            value={
              chargeGroup.invoiceable
                ? translate('text_65251f46339c650084ce0d57')
                : translate('text_65251f4cd55aeb004e5aa5ef')
            }
          />
          <DetailsInfoItem
            label={translate('text_645bb193927b375079d28a8f')}
            value={
              // No taxes on charge group
              '-'
            }
          />
        </DetailsInfoGrid>
      </PaddedOptionsWrapper>
    </Container>
  )
}

export default PlanDetailsChargeGroupSectionAccordion

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const ChargeSectionWrapper = styled.section`
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

const ChargeSummaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
`
