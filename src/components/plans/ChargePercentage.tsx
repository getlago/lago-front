import { useCallback } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import styled from 'styled-components'

import { intlFormatNumber } from '~/core/intlFormatNumber'
import { TextInput } from '~/components/form'
import { MenuPopper, theme } from '~/styles'
import { Alert, Typography, Button, Tooltip, Popper } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum } from '~/generated/graphql'

import { LocalChargeInput } from './types'

interface ChargePercentageProps<T> {
  disabled?: boolean
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<T>
  formikIdentifier: string
}

export const ChargePercentage = <T extends Record<string, unknown>>({
  currency,
  disabled,
  chargeIndex,
  formikProps,
  formikIdentifier,
}: ChargePercentageProps<T>) => {
  const { translate } = useInternationalization()
  const localCharge = _get(
    formikProps.values,
    `${formikIdentifier}.${chargeIndex}`
  ) as LocalChargeInput
  const showFixedAmount = localCharge.fixedAmount !== undefined
  const showFreeUnitsPerEvents = localCharge.freeUnitsPerEvents !== undefined
  const showFreeUnitsPerTotalAggregation = localCharge.freeUnitsPerTotalAggregation !== undefined
  let freeUnitsPerTotalAggregationTranslation = translate('text_6303351deffd2a0d70498677', {
    freeAmountUnits: intlFormatNumber(Number(localCharge.freeUnitsPerTotalAggregation) * 100 || 0, {
      currencyDisplay: 'symbol',
      currency,
      maximumFractionDigits: 5,
    }),
  })
  const handleUpdate = useCallback(
    (name: string, value: string | number) => {
      formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}.${name}`, value)
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
        name="rate"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        beforeChangeFormatter={['positiveNumber', 'decimal']}
        error={_get(formikProps.errors, `${formikIdentifier}.${chargeIndex}.rate`) as string}
        disabled={disabled}
        placeholder={translate('text_62a0b7107afa2700a65ef700')}
        value={localCharge.rate as number | undefined}
        onChange={(value) => handleUpdate('rate', value)}
        InputProps={{
          endAdornment: (
            <InputEnd color={disabled ? 'disabled' : 'textSecondary'}>
              {translate('text_62a0b7107afa2700a65ef70a')}
            </InputEnd>
          ),
        }}
      />

      {localCharge.fixedAmount !== undefined && (
        <LineAmount>
          <Input
            name="fixedAmount"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc1e')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc24')}
            value={localCharge.fixedAmount || ''}
            onChange={(value) => handleUpdate('fixedAmount', value)}
            InputProps={{
              endAdornment: <InputEnd color="textSecondary">{currency}</InputEnd>,
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
                formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
                  ...localCharge,
                  fixedAmount: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {localCharge.freeUnitsPerEvents !== undefined && (
        <LineAmount>
          <Input
            name="freeUnitsPerEvents"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'int']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc36')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
            value={localCharge.freeUnitsPerEvents || ''}
            onChange={(value) => handleUpdate('freeUnitsPerEvents', value)}
            InputProps={{
              endAdornment: (
                <InputEnd color="textSecondary">
                  {translate('text_62ff5d01a306e274d4ffcc42')}
                </InputEnd>
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
                formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
                  ...localCharge,
                  freeUnitsPerEvents: undefined,
                })
              }}
            />
          </Tooltip>
        </LineAmount>
      )}

      {localCharge.freeUnitsPerTotalAggregation !== undefined && (
        <LineAmount>
          {localCharge.freeUnitsPerEvents !== undefined &&
            localCharge.freeUnitsPerTotalAggregation !== undefined && (
              <OrText variant="body">{translate('text_62ff5d01a306e274d4ffcc59')}</OrText>
            )}
          <Input
            name="freeUnitsPerTotalAggregation"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_62ff5d01a306e274d4ffcc48')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc4e')}
            value={localCharge.freeUnitsPerTotalAggregation || ''}
            onChange={(value) => handleUpdate('freeUnitsPerTotalAggregation', value)}
            InputProps={{
              endAdornment: <InputEnd color="textSecondary">{currency}</InputEnd>,
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
                formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
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
          disabled={disabled || localCharge.fixedAmount !== undefined}
          onClick={() =>
            formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
              ...localCharge,
              fixedAmount: '',
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
                (localCharge.freeUnitsPerEvents !== undefined &&
                  localCharge.freeUnitsPerTotalAggregation !== undefined)
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
                disabled={disabled || localCharge.freeUnitsPerEvents !== undefined}
                onClick={() => {
                  formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
                    ...localCharge,
                    freeUnitsPerEvents: '',
                  })
                  closePopper()
                }}
              >
                {translate('text_62ff5d01a306e274d4ffcc3e')}
              </FreeUnitButton>
              <FreeUnitButton
                variant="quaternary"
                disabled={disabled || localCharge.freeUnitsPerTotalAggregation !== undefined}
                onClick={() => {
                  formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}`, {
                    ...localCharge,
                    freeUnitsPerTotalAggregation: '',
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
            percentageFee: intlFormatNumber(Number(localCharge.rate) || 0, {
              minimumFractionDigits: 2,
              style: 'percent',
            }),
          })}
        </Typography>

        {showFixedAmount && (
          <Typography color="textSecondary">
            {translate('text_62ff5d01a306e274d4ffcc69', {
              fixedFeeValue: intlFormatNumber(Number(localCharge.fixedAmount) * 100 || 0, {
                currencyDisplay: 'symbol',
                currency,
                maximumFractionDigits: 5,
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
                  freeEventUnits: localCharge.freeUnitsPerEvents || 0,
                },
                Math.max(Number(localCharge.freeUnitsPerEvents) || 0)
              )}

            {/* Spaces bellow are important */}
            {showFreeUnitsPerEvents &&
              showFreeUnitsPerTotalAggregation &&
              ` ${translate('text_6303351deffd2a0d70498675')} `}

            {showFreeUnitsPerTotalAggregation && freeUnitsPerTotalAggregationTranslation}

            {` ${translate(
              'text_6303351deffd2a0d70498679',
              {
                freeEventUnits: localCharge.freeUnitsPerEvents || 0,
              },
              (localCharge.freeUnitsPerEvents || 0) < 2 && !showFreeUnitsPerTotalAggregation ? 1 : 2
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

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
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
  justify-content: flex-start;
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
