import { useState, useCallback, useEffect } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { FormikProps } from 'formik'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Button, Typography, Tooltip, Alert } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { ChargeFrequency, ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { ComboBox, ButtonSelector, TextInput, Switch } from '~/components/form'

import { PlanForm } from './types'

interface ChargeAccordionProps {
  index: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanForm>
}

export const ChargeAccordion = ({ index, currency, formikProps }: ChargeAccordionProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const { translate } = useI18nContext()
  const localCharge = formikProps.values.charges[index]

  const handleUpdate = useCallback(
    (name, value) => {
      formikProps.setFieldValue(`charges.${index}.${name}`, value)
    },
    [index]
  )

  useEffect(() => {
    handleUpdate('amountCurrency', currency)
  }, [currency, handleUpdate])

  return (
    <Container>
      <StyledAccordion expanded={isOpen} onChange={(_, expanded) => setIsOpen(expanded)} square>
        <Summary>
          <Tooltip
            placement="top-start"
            title={translate(
              isOpen ? 'text_624aa732d6af4e0103d40e61' : 'text_624aa79870f60300a3c4d074'
            )}
          >
            <Button
              variant="quaternary"
              size="small"
              icon={isOpen ? 'chevron-down' : 'chevron-right'}
            />
          </Tooltip>
          <Title color="textSecondary">
            {localCharge?.billableMetric?.name}{' '}
            <Typography>({localCharge?.billableMetric?.code})</Typography>
          </Title>
          <Tooltip placement="top-end" title={translate('text_624aa732d6af4e0103d40e65')}>
            <Button
              variant="quaternary"
              size="small"
              icon="trash"
              onClick={() => {
                const charges = formikProps.values.charges

                charges.splice(index, 1)

                formikProps.setFieldValue('charges', charges)
              }}
            />
          </Tooltip>
        </Summary>
        <Details>
          <ComboBox
            name="chargeModel"
            label={translate('text_624aa732d6af4e0103d40e6b')}
            data={[
              {
                label: translate('text_624aa732d6af4e0103d40e6f'),
                value: ChargeModelEnum.Standard,
              },
            ]}
            disableClearable
            value={localCharge.chargeModel}
            onChange={(value) => handleUpdate('chargeModel', value)}
          />

          <LineAmount>
            <TextInput
              name="amountCents"
              label={translate('text_624453d52e945301380e49b6')}
              placeholder={translate('text_624453d52e945301380e49b8')}
              type="number"
              value={localCharge.amountCents}
              onChange={(value) => handleUpdate('amountCents', value)}
            />
            <ComboBox
              name="amountCurrency"
              disabled
              data={[
                {
                  label: translate('text_624453d52e945301380e49ba'),
                  value: CurrencyEnum.Usd,
                },
                {
                  label: 'EUR', // TODO
                  value: CurrencyEnum.Eur,
                },
              ]}
              disableClearable
              value={localCharge.amountCurrency}
              onChange={(value) => handleUpdate('amountCurrency', value)}
            />
          </LineAmount>

          <ButtonSelector
            label={translate('text_624aa732d6af4e0103d40e7c')}
            options={[
              {
                label: translate('text_624aa732d6af4e0103d40e7e'),
                value: ChargeFrequency.Recurring,
              },
              {
                label: translate('text_624aa732d6af4e0103d40e80'),
                value: ChargeFrequency.OneTime,
              },
            ]}
            value={localCharge.frequency}
            onChange={(value) => handleUpdate('frequency', value)}
          />

          <Alert type="info">
            {translate(
              localCharge.frequency === ChargeFrequency.Recurring
                ? 'text_624aa732d6af4e0103d40e82'
                : 'text_624aa79870f60300a3c4d089'
            )}
          </Alert>

          <TextInput
            name="vatRate"
            label={translate('text_624aa732d6af4e0103d40e3b')}
            placeholder={translate('text_624aa732d6af4e0103d40e86')}
            type="number"
            InputProps={{
              endAdornment: (
                <InputEnd color="textSecondary">
                  {translate('text_624aa732d6af4e0103d40e88')}
                </InputEnd>
              ),
            }}
            value={localCharge.vatRate as number}
            onChange={(value) => handleUpdate('vatRate', value)}
          />

          <SwitchBlock>
            <Switch
              name="proRata"
              checked={localCharge.proRata}
              onChange={(value) => handleUpdate('proRata', value)}
            />
            <div>
              <Typography color="textSecondary">
                {translate('text_624aa732d6af4e0103d40e8a')}
              </Typography>
              <Typography variant="caption">
                {translate('text_624aa732d6af4e0103d40e8e')}
              </Typography>
            </div>
          </SwitchBlock>
        </Details>
      </StyledAccordion>
    </Container>
  )
}

const Container = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const StyledAccordion = styled(Accordion)`
  border-radius: 12px;

  &.MuiAccordion-root.MuiPaper-root {
    border-radius: 12px;
    background-color: transparent;
  }
  &.MuiAccordion-root:before {
    height: 0;
  }
  &.MuiAccordion-root.Mui-expanded {
    margin: 0 0 ${theme.spacing(6)};
  }

  .MuiAccordionSummary-content {
    width: 100%;
  }
`

const Summary = styled(AccordionSummary)`
  && {
    height: 60px;
    border-radius: 12px;

    &.MuiAccordionSummary-root.Mui-focused {
      border-radius: 12px;
    }

    .MuiAccordionSummary-content {
      display: flex;
      align-items: center;
      padding: ${theme.spacing(4)};

      > *:first-child {
        margin-right: ${theme.spacing(4)};
      }
    }
  }
`

const Title = styled(Typography)`
  display: flex;
  margin-right: auto;
  white-space: pre;
`

const Details = styled(AccordionDetails)`
  display: flex;
  flex-direction: column;

  &.MuiAccordionDetails-root {
    padding: ${theme.spacing(4)};

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(6)};
    }
  }
`

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

const SwitchBlock = styled.div`
  display: flex;
  align-items: center;
  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`
