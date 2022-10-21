import { useCallback } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { intlFormatNumber, getCurrencySymbol } from '~/core/intlFormatNumber'
import { TextInput } from '~/components/form'
import { MenuPopper, theme } from '~/styles'
import { Alert, Typography, Button, Tooltip, Popper } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum } from '~/generated/graphql'

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
  }
`

interface ChargePercentageProps {
  disabled?: boolean
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
}

export const ChargePercentage = ({
  currency,
  disabled,
  chargeIndex,
  formikProps,
}: ChargePercentageProps) => {
  const { translate } = useInternationalization()
  const localCharge = formikProps.values.charges[chargeIndex]
  const showFixedAmount = localCharge.properties?.fixedAmount !== undefined
  const showFreeUnitsPerEvents = localCharge.properties?.freeUnitsPerEvents !== undefined
  const showFreeUnitsPerTotalAggregation =
    localCharge.properties?.freeUnitsPerTotalAggregation !== undefined
  let freeUnitsPerTotalAggregationTranslation = translate('text_6303351deffd2a0d70498677', {
    freeAmountUnits: intlFormatNumber(
      Number(localCharge.properties?.freeUnitsPerTotalAggregation) * 100 || 0,
      {
        currencyDisplay: 'symbol',
        currency,
        maximumFractionDigits: 5,
      }
    ),
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
        label={translate('text_62a0b7107afa2700a65ef6f6')}
        name="properties.rate"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        beforeChangeFormatter={['positiveNumber', 'decimal']}
        error={_get(formikProps.errors, `charges.${chargeIndex}.properties.rate`)}
        disabled={disabled}
        placeholder={translate('text_62a0b7107afa2700a65ef700')}
        value={localCharge.properties?.rate as number | undefined}
        onChange={(value) => handleUpdate('properties.rate', value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {translate('text_62a0b7107afa2700a65ef70a')}
            </InputAdornment>
          ),
        }}
      />

      {localCharge.properties?.fixedAmount !== undefined && (
        <LineAmount>
          <Input
            name="properties.fixedAmount"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc1e')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc24')}
            value={localCharge.properties?.fixedAmount || ''}
            onChange={(value) => handleUpdate('properties.fixedAmount', value)}
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
                formikProps.setFieldValue(`charges.${chargeIndex}.properties`, {
                  ...localCharge,
                  fixedAmount: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {localCharge.properties?.freeUnitsPerEvents !== undefined && (
        <LineAmount>
          <Input
            name="properties.freeUnitsPerEvents"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'int']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc36')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
            value={localCharge.properties?.freeUnitsPerEvents || ''}
            onChange={(value) => handleUpdate('properties.freeUnitsPerEvents', value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62ff5d01a306e274d4ffcc42')}
                </InputAdornment>
              ),
            }}
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
                formikProps.setFieldValue(`charges.${chargeIndex}.properties`, {
                  ...localCharge,
                  freeUnitsPerEvents: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {localCharge.properties?.freeUnitsPerTotalAggregation !== undefined && (
        <LineAmount>
          {localCharge.properties?.freeUnitsPerEvents !== undefined &&
            localCharge.properties?.freeUnitsPerTotalAggregation !== undefined && (
              <OrText variant="body">{translate('text_62ff5d01a306e274d4ffcc59')}</OrText>
            )}
          <Input
            name="properties.freeUnitsPerTotalAggregation"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc48')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc4e')}
            value={localCharge.properties?.freeUnitsPerTotalAggregation || ''}
            onChange={(value) => handleUpdate('properties.freeUnitsPerTotalAggregation', value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
              ),
            }}
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
                formikProps.setFieldValue(`charges.${chargeIndex}.properties`, {
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
          disabled={disabled || localCharge.properties?.fixedAmount !== undefined}
          onClick={() =>
            formikProps.setFieldValue(`charges.${chargeIndex}`, {
              ...localCharge,
              properties: { ...localCharge.properties, fixedAmount: '' },
            })
          }
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
                (localCharge.properties?.freeUnitsPerEvents !== undefined &&
                  localCharge.properties?.freeUnitsPerTotalAggregation !== undefined)
              }
            >
              {translate('text_62ff5d01a306e274d4ffcc61')}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <FreeUnitButton
                variant="quaternary"
                disabled={disabled || localCharge.properties?.freeUnitsPerEvents !== undefined}
                onClick={() => {
                  formikProps.setFieldValue(`charges.${chargeIndex}`, {
                    ...localCharge,
                    properties: { ...localCharge.properties, freeUnitsPerEvents: '' },
                  })
                  closePopper()
                }}
              >
                {translate('text_62ff5d01a306e274d4ffcc3e')}
              </FreeUnitButton>
              <FreeUnitButton
                variant="quaternary"
                disabled={
                  disabled || localCharge.properties?.freeUnitsPerTotalAggregation !== undefined
                }
                onClick={() => {
                  formikProps.setFieldValue(`charges.${chargeIndex}`, {
                    ...localCharge,
                    properties: { ...localCharge.properties, freeUnitsPerTotalAggregation: '' },
                  })
                  closePopper()
                }}
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
            percentageFee: intlFormatNumber(Number(localCharge.properties?.rate) || 0, {
              minimumFractionDigits: 2,
              style: 'percent',
            }),
          })}
        </Typography>

        {showFixedAmount && (
          <Typography color="textSecondary">
            {translate('text_62ff5d01a306e274d4ffcc69', {
              fixedFeeValue: intlFormatNumber(
                Number(localCharge.properties?.fixedAmount) * 100 || 0,
                {
                  currencyDisplay: 'symbol',
                  currency,
                  maximumFractionDigits: 5,
                }
              ),
            })}
          </Typography>
        )}
        {(showFreeUnitsPerEvents || showFreeUnitsPerTotalAggregation) && (
          <Typography color="textSecondary">
            {showFreeUnitsPerEvents &&
              translate(
                'text_62ff5d01a306e274d4ffcc6d',
                {
                  freeEventUnits: localCharge.properties?.freeUnitsPerEvents || 0,
                },
                Math.max(Number(localCharge.properties?.freeUnitsPerEvents) || 0)
              )}

            {/* Spaces bellow are important */}
            {showFreeUnitsPerEvents &&
              showFreeUnitsPerTotalAggregation &&
              ` ${translate('text_6303351deffd2a0d70498675')} `}

            {showFreeUnitsPerTotalAggregation && freeUnitsPerTotalAggregationTranslation}

            {` ${translate(
              'text_6303351deffd2a0d70498679',
              {
                freeEventUnits: localCharge.properties?.freeUnitsPerEvents || 0,
              },
              (localCharge.properties?.freeUnitsPerEvents || 0) < 2 &&
                !showFreeUnitsPerTotalAggregation
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
