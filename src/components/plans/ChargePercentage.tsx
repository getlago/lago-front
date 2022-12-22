import { useCallback } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { AmountInput, TextInput } from '~/components/form'
import { MenuPopper, theme } from '~/styles'
import { Alert, Typography, Button, Tooltip, Popper } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'

import { PlanFormInput } from './types'

gql`
  fragment PercentageCharge on Charge {
    id
    properties {
      fixedAmount
      freeUnitsPerEvents
      freeUnitsPerTotalAggregation
      rate
    }
    groupProperties {
      groupId
      values {
        fixedAmount
        freeUnitsPerEvents
        freeUnitsPerTotalAggregation
        rate
      }
    }
  }
`

interface ChargePercentageProps {
  disabled?: boolean
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const ChargePercentage = ({
  currency,
  disabled,
  chargeIndex,
  formikProps,
  propertyCursor,
  valuePointer,
}: ChargePercentageProps) => {
  const { translate } = useInternationalization()
  const localCharge = formikProps.values.charges[chargeIndex]
  const showFixedAmount = valuePointer?.fixedAmount !== undefined
  const showFreeUnitsPerEvents = valuePointer?.freeUnitsPerEvents !== undefined
  const showFreeUnitsPerTotalAggregation = valuePointer?.freeUnitsPerTotalAggregation !== undefined
  let freeUnitsPerTotalAggregationTranslation = translate('text_6303351deffd2a0d70498677', {
    freeAmountUnits: intlFormatNumber(Number(valuePointer?.freeUnitsPerTotalAggregation) || 0, {
      currencyDisplay: 'symbol',
      currency,
      maximumFractionDigits: 15,
    }),
  })
  const handleUpdate = useCallback(
    (name: string, value: string | number) => {
      formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chargeIndex]
  )

  if (!showFreeUnitsPerEvents && showFreeUnitsPerTotalAggregation) {
    freeUnitsPerTotalAggregationTranslation =
      freeUnitsPerTotalAggregationTranslation.charAt(0).toUpperCase() +
      freeUnitsPerTotalAggregationTranslation.slice(1)
  }

  return (
    <Container>
      <Input
        name={`${propertyCursor}.rate`}
        label={translate('text_62a0b7107afa2700a65ef6f6')}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        beforeChangeFormatter={['positiveNumber', 'decimal']}
        error={_get(formikProps.errors, `charges.${chargeIndex}.${propertyCursor}.rate`)}
        disabled={disabled}
        placeholder={translate('text_62a0b7107afa2700a65ef700')}
        value={valuePointer?.rate as number | undefined}
        onChange={(value) => handleUpdate(`${propertyCursor}.rate`, value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {translate('text_62a0b7107afa2700a65ef70a')}
            </InputAdornment>
          ),
        }}
      />

      {valuePointer?.fixedAmount !== undefined && (
        <LineAmount>
          <Amount
            name={`${propertyCursor}.fixedAmount`}
            currency={currency}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc1e')}
            value={valuePointer?.fixedAmount || ''}
            onChange={(value) => handleUpdate(`${propertyCursor}.fixedAmount`, value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
              ),
            }}
            helperText={translate('text_62ff5d01a306e274d4ffcc30')}
          />
          <Tooltip
            disableHoverListener={disabled}
            title={translate('text_62ff5d01a306e274d4ffcc28')}
            placement="top-end"
          >
            <Button
              icon="trash"
              size="small"
              disabled={disabled}
              variant="quaternary"
              onClick={() => {
                formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
                  ...localCharge,
                  fixedAmount: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {valuePointer?.freeUnitsPerEvents !== undefined && (
        <LineAmount>
          <Input
            name={`${propertyCursor}.freeUnitsPerEvents`}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'int']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc36')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
            value={valuePointer?.freeUnitsPerEvents || ''}
            onChange={(value) => handleUpdate(`${propertyCursor}.freeUnitsPerEvents`, value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62ff5d01a306e274d4ffcc42')}
                </InputAdornment>
              ),
            }}
            data-test="free-unit-per-event"
          />
          <Tooltip
            disableHoverListener={disabled}
            title={translate('text_62ff5d01a306e274d4ffcc46')}
            placement="top-end"
          >
            <Button
              icon="trash"
              size="small"
              disabled={disabled}
              variant="quaternary"
              onClick={() => {
                formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
                  ...localCharge,
                  freeUnitsPerEvents: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {valuePointer?.freeUnitsPerTotalAggregation !== undefined && (
        <LineAmount>
          {valuePointer?.freeUnitsPerEvents !== undefined &&
            valuePointer?.freeUnitsPerTotalAggregation !== undefined && (
              <OrText variant="body">{translate('text_62ff5d01a306e274d4ffcc59')}</OrText>
            )}
          <Amount
            name={`${propertyCursor}.freeUnitsPerTotalAggregation`}
            currency={currency}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc48')}
            value={valuePointer?.freeUnitsPerTotalAggregation || ''}
            onChange={(value) =>
              handleUpdate(`${propertyCursor}.freeUnitsPerTotalAggregation`, value)
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
              ),
            }}
            data-test="free-unit-per-total-aggregation"
          />
          <Tooltip
            disableHoverListener={disabled}
            title={translate('text_62ff5d01a306e274d4ffcc5b')}
            placement="top-end"
          >
            <Button
              icon="trash"
              size="small"
              disabled={disabled}
              variant="quaternary"
              onClick={() => {
                formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
                  ...localCharge,
                  freeUnitsPerTotalAggregation: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      <LineButton>
        <Button
          startIcon="plus"
          variant="quaternary"
          disabled={disabled || valuePointer?.fixedAmount !== undefined}
          onClick={() =>
            formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
              ...valuePointer,
              fixedAmount: '',
            })
          }
          data-test="add-fixed-fee"
        >
          {translate('text_62ff5d01a306e274d4ffcc5d')}
        </Button>

        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button
              startIcon="plus"
              endIcon="chevron-down"
              variant="quaternary"
              disabled={
                disabled ||
                (valuePointer?.freeUnitsPerEvents !== undefined &&
                  valuePointer?.freeUnitsPerTotalAggregation !== undefined)
              }
              data-test="add-free-units"
            >
              {translate('text_62ff5d01a306e274d4ffcc61')}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <FreeUnitButton
                variant="quaternary"
                disabled={disabled || valuePointer?.freeUnitsPerEvents !== undefined}
                onClick={() => {
                  formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    freeUnitsPerEvents: '',
                  })
                  closePopper()
                }}
                data-test="add-free-units-events"
              >
                {translate('text_62ff5d01a306e274d4ffcc3e')}
              </FreeUnitButton>
              <FreeUnitButton
                variant="quaternary"
                disabled={disabled || valuePointer?.freeUnitsPerTotalAggregation !== undefined}
                onClick={() => {
                  formikProps.setFieldValue(`charges.${chargeIndex}.${propertyCursor}`, {
                    ...valuePointer,
                    freeUnitsPerTotalAggregation: '',
                  })

                  closePopper()
                }}
                data-test="add-free-units-total-amount"
              >
                {translate('text_62ff5d01a306e274d4ffcc44')}
              </FreeUnitButton>
            </MenuPopper>
          )}
        </Popper>
      </LineButton>

      <Alert type="info">
        <Typography color="textSecondary">
          {translate('text_62ff5d01a306e274d4ffcc65', {
            percentageFee: intlFormatNumber(Number(valuePointer?.rate) / 100 || 0, {
              minimumFractionDigits: 2,
              style: 'percent',
            }),
          })}
        </Typography>

        {showFixedAmount && (
          <Typography color="textSecondary">
            {translate('text_62ff5d01a306e274d4ffcc69', {
              fixedFeeValue: intlFormatNumber(Number(valuePointer?.fixedAmount) || 0, {
                currencyDisplay: 'symbol',
                currency,
                maximumFractionDigits: 15,
              }),
            })}
          </Typography>
        )}
        {(showFreeUnitsPerEvents || showFreeUnitsPerTotalAggregation) && (
          <Typography color="textSecondary">
            {showFreeUnitsPerEvents &&
              translate(
                'text_62ff5d01a306e274d4ffcc6d',
                {
                  freeEventUnits: valuePointer?.freeUnitsPerEvents || 0,
                },
                Math.max(Number(valuePointer?.freeUnitsPerEvents) || 0)
              )}

            {/* Spaces bellow are important */}
            {showFreeUnitsPerEvents &&
              showFreeUnitsPerTotalAggregation &&
              ` ${translate('text_6303351deffd2a0d70498675')} `}

            {showFreeUnitsPerTotalAggregation && freeUnitsPerTotalAggregationTranslation}

            {` ${translate(
              'text_6303351deffd2a0d70498679',
              {
                freeEventUnits: valuePointer?.freeUnitsPerEvents || 0,
              },
              (valuePointer?.freeUnitsPerEvents || 0) < 2 && !showFreeUnitsPerTotalAggregation
                ? 1
                : 2
            )}`}
          </Typography>
        )}
      </Alert>
    </Container>
  )
}

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const Input = styled(TextInput)`
  flex: 1;
`

const Amount = styled(AmountInput)`
  flex: 1;
`

const LineAmount = styled.div`
  display: flex;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }

  > *:last-child {
    margin-top: 34px;
  }
`

const FreeUnitButton = styled(Button)`
  justify-content: flex-start !important;
`

const OrText = styled(Typography)`
  flex: initial;
  margin-top: 34px;
`

const LineButton = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`
