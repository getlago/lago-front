import { useState, useCallback, MouseEvent } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import _get from 'lodash/get'

import { theme, NAV_HEIGHT } from '~/styles'
import { Button, Typography, Tooltip } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { ComboBox, TextInput } from '~/components/form'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargePercentage } from '~/components/plans/ChargePercentage'

import { LocalChargeInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'

interface ChargeAccordionProps<T> {
  id: string
  index: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<T>
  formikIdentifier: string
  preventDelete?: boolean
}

export const ChargeAccordion = <T extends Record<string, unknown>>({
  id,
  index,
  currency,
  disabled,
  formikProps,
  formikIdentifier,
  preventDelete = false,
}: ChargeAccordionProps<T>) => {
  const [isOpen, setIsOpen] = useState(
    !_get(formikProps.values, `${formikIdentifier}.${index}.id`) ? true : false
  )
  const { translate } = useInternationalization()
  const localCharge = _get(formikProps.values, `${formikIdentifier}.${index}`) as LocalChargeInput

  const handleUpdate = useCallback(
    (name: string, value: string) => {
      formikProps.setFieldValue(`${formikIdentifier}.${index}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, formikProps.setFieldValue]
  )

  return (
    <Container id={id}>
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
          <Title>
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {localCharge?.billableMetric?.name}
            </Typography>
            <Typography variant="caption" noWrap>
              {localCharge?.billableMetric?.code}
            </Typography>
          </Title>
          {!disabled && !preventDelete && (
            <Tooltip
              placement="top-end"
              title={
                ChargeModelEnum.Volume
                  ? translate('text_6304e74aab6dbc18d615f421')
                  : translate('text_624aa732d6af4e0103d40e65')
              }
            >
              <Button
                variant="quaternary"
                size="small"
                icon="trash"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const charges = [
                    ...(_get(formikProps.values, formikIdentifier) as LocalChargeInput[]),
                  ]

                  charges.splice(index, 1)
                  formikProps.setFieldValue(formikIdentifier, charges)
                }}
              />
            </Tooltip>
          )}
        </Summary>
        <Details>
          <ComboBox
            name="chargeModel"
            disabled={disabled}
            label={translate('text_624c5eadff7db800acc4ca0d')}
            data={[
              {
                label: translate('text_624aa732d6af4e0103d40e6f'),
                value: ChargeModelEnum.Standard,
              },
              {
                label: translate('text_62793bbb599f1c01522e919f'),
                value: ChargeModelEnum.Graduated,
              },
              {
                label: translate('text_62a0b7107afa2700a65ef6e2'),
                value: ChargeModelEnum.Percentage,
              },
              {
                label: translate('text_6282085b4f283b0102655868'),
                value: ChargeModelEnum.Package,
              },
              {
                label: translate('text_6304e74aab6dbc18d615f386'),
                value: ChargeModelEnum.Volume,
              },
            ]}
            disableClearable
            value={localCharge.chargeModel}
            helperText={translate(
              localCharge.chargeModel === ChargeModelEnum.Percentage
                ? 'text_62ff5d01a306e274d4ffcc06'
                : localCharge.chargeModel === ChargeModelEnum.Graduated
                ? 'text_62793bbb599f1c01522e91a1'
                : localCharge.chargeModel === ChargeModelEnum.Package
                ? 'text_6282085b4f283b010265586c'
                : localCharge.chargeModel === ChargeModelEnum.Volume
                ? 'text_6304e74aab6dbc18d615f38a'
                : 'text_624d9adba93343010cd14ca7'
            )}
            onChange={(value) => handleUpdate('chargeModel', value)}
          />

          {localCharge.chargeModel === ChargeModelEnum.Standard && (
            <LineAmount>
              <TextInput
                name="amount"
                beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                disabled={disabled}
                label={translate('text_624453d52e945301380e49b6')}
                placeholder={translate('text_624453d52e945301380e49b8')}
                value={localCharge.amount || ''}
                onChange={(value) => handleUpdate('amount', value)}
              />
              <ComboBox
                name="amountCurrency"
                disabled
                data={Object.values(CurrencyEnum).map((currencyType) => ({
                  value: currencyType,
                }))}
                disableClearable
                value={currency}
                onChange={() => {}}
              />
            </LineAmount>
          )}
          {localCharge.chargeModel === ChargeModelEnum.Package && (
            <PackageCharge
              currency={currency}
              disabled={disabled}
              chargeIndex={index}
              formikProps={formikProps}
              formikIdentifier={formikIdentifier}
            />
          )}
          {localCharge.chargeModel === ChargeModelEnum.Graduated && (
            <GraduatedChargeTable
              disabled={disabled}
              chargeIndex={index}
              currency={currency}
              formikProps={formikProps}
              formikIdentifier={formikIdentifier}
            />
          )}
          {localCharge.chargeModel === ChargeModelEnum.Percentage && (
            <ChargePercentage
              currency={currency}
              disabled={disabled}
              chargeIndex={index}
              formikProps={formikProps}
              formikIdentifier={formikIdentifier}
            />
          )}
          {localCharge.chargeModel === ChargeModelEnum.Volume && (
            <VolumeChargeTable
              currency={currency}
              disabled={disabled}
              chargeIndex={index}
              formikProps={formikProps}
              formikIdentifier={formikIdentifier}
            />
          )}
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
  overflow: hidden;

  &.MuiAccordion-root.MuiPaper-root {
    border-radius: 12px;
    background-color: transparent;
  }
  &.MuiAccordion-root:before {
    height: 0;
  }
  &.MuiAccordion-root.Mui-expanded {
    margin: 0;
  }

  .MuiAccordionSummary-content {
    width: 100%;
  }
`

const Summary = styled(AccordionSummary)`
  && {
    height: ${NAV_HEIGHT}px;
    border-radius: 12px;

    &.MuiAccordionSummary-root.Mui-focused {
      border-radius: 12px;
    }

    .MuiAccordionSummary-content {
      display: flex;
      height: ${NAV_HEIGHT}px;
      box-sizing: border-box;
      align-items: center;
      padding: ${theme.spacing(4)};

      &:hover {
        background-color: ${theme.palette.grey[100]};
      }

      > *:first-child {
        margin-right: ${theme.spacing(4)};
      }
    }
  }
`

const Details = styled(AccordionDetails)`
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows[5]};

  &.MuiAccordionDetails-root {
    padding: ${theme.spacing(4)};

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(6)};
    }
  }
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  white-space: pre;
  min-width: 20px;
  margin-right: auto;
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
