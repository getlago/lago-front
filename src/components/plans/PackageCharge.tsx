import { useCallback, useEffect } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import _get from 'lodash/get'
import { InputAdornment } from '@mui/material'

import { ComboBox, TextInput } from '~/components/form'
import { Alert, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { CurrencyEnum } from '~/generated/graphql'
import { intlFormatNumber } from '~/core/intlFormatNumber'

import { LocalChargeInput } from './types'

interface PackageChargeProps<T> {
  disabled?: boolean
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<T>
  formikIdentifier: string
}

export const PackageCharge = <T extends Record<string, unknown>>({
  currency,
  disabled,
  chargeIndex,
  formikProps,
  formikIdentifier,
}: PackageChargeProps<T>) => {
  const { translate } = useInternationalization()
  const localCharge = _get(
    formikProps.values,
    `${formikIdentifier}.${chargeIndex}`
  ) as LocalChargeInput

  const handleUpdate = useCallback(
    (name: string, value: string) => {
      formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chargeIndex]
  )

  useEffect(() => {
    if (!localCharge.packageSize) {
      formikProps.setFieldValue(`${formikIdentifier}.${chargeIndex}.packageSize`, 10)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <LineAmount>
        <TextInput
          name="amountCents"
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          label={translate('text_6282085b4f283b0102655870')}
          placeholder={translate('text_62824f0e5d93bc008d268cf4')}
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
      <TextInput
        name="packageSize"
        beforeChangeFormatter={['positiveNumber', 'int']}
        error={_get(formikProps.errors, `${formikIdentifier}.${chargeIndex}.packageSize`) as string}
        disabled={disabled}
        value={localCharge.packageSize as number | undefined}
        onChange={(value) => handleUpdate('packageSize', value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography color={disabled ? 'disabled' : 'textSecondary'}>
                {translate('text_6282085b4f283b010265587c')}
              </Typography>
            </InputAdornment>
          ),
          endAdornment: (
            <InputEnd color={disabled ? 'disabled' : 'textSecondary'}>
              {translate('text_6282085b4f283b0102655884')}
            </InputEnd>
          ),
        }}
      />
      <TextInput
        name="freeUnits"
        label={translate('text_6282085b4f283b010265588c')}
        placeholder={translate('text_62824f0e5d93bc008d268d00')}
        beforeChangeFormatter={['positiveNumber', 'int']}
        disabled={disabled}
        value={localCharge.freeUnits as number | undefined}
        onChange={(value) => handleUpdate('freeUnits', value)}
        InputProps={{
          endAdornment: (
            <InputEnd color={disabled ? 'disabled' : 'textSecondary'}>
              {translate('text_6282085b4f283b0102655894')}
            </InputEnd>
          ),
        }}
      />
      <Alert type="info">
        {!localCharge.packageSize ? (
          <Typography color="textSecondary">
            {translate('text_6282085b4f283b0102655898')}
          </Typography>
        ) : (
          <>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_6282085b4f283b0102655892', {
                units: localCharge.packageSize + (localCharge.freeUnits || 0) + 1,
                cost: intlFormatNumber(Number(localCharge.amount || 0) * 2, {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  maximumFractionDigits: 5,
                  currency,
                }),
              })}
            </Typography>
            {!!localCharge.freeUnits && (
              <Typography color="textSecondary">
                {translate('text_6282085b4f283b0102655896', {
                  unit: 1,
                  unitInPackage: localCharge.freeUnits,
                  cost: intlFormatNumber(0, {
                    currencyDisplay: 'code',
                    initialUnit: 'standard',
                    maximumFractionDigits: 5,
                    currency,
                  }),
                })}
              </Typography>
            )}

            <Typography color="textSecondary">
              {translate('text_6282085b4f283b0102655896', {
                unit: (localCharge.freeUnits || 0) + 1,
                unitInPackage: localCharge.packageSize + (localCharge.freeUnits || 0),
                cost: intlFormatNumber(Number(localCharge.amount || 0), {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  maximumFractionDigits: 5,
                  currency,
                }),
              })}
            </Typography>
            <Typography color="textSecondary">
              {translate('text_6282085b4f283b0102655896', {
                unit: (localCharge.freeUnits || 0) + localCharge.packageSize + 1,
                unitInPackage: localCharge.packageSize * 2 + (localCharge.freeUnits || 0),
                cost: intlFormatNumber(Number(localCharge.amount || 0) * 2, {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  maximumFractionDigits: 5,
                  currency,
                }),
              })}
            </Typography>
          </>
        )}
      </Alert>
    </>
  )
}

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

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`
