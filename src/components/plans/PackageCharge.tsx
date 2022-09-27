import { useCallback, useEffect } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { InputAdornment } from '@mui/material'

import { TextInput } from '~/components/form'
import { Alert, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum } from '~/generated/graphql'
import { intlFormatNumber, getCurrencySymbol } from '~/core/intlFormatNumber'

import { PlanFormInput } from './types'

interface PackageChargeProps {
  disabled?: boolean
  chargeIndex: number
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
}

export const PackageCharge = ({
  currency,
  disabled,
  chargeIndex,
  formikProps,
}: PackageChargeProps) => {
  const { translate } = useInternationalization()
  const localCharge = formikProps.values.charges[chargeIndex]

  const handleUpdate = useCallback(
    (name: string, value: string) => {
      formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chargeIndex]
  )

  useEffect(() => {
    if (!localCharge.packageSize) {
      formikProps.setFieldValue(`charges.${chargeIndex}.packageSize`, 10)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <TextInput
        name="amountCents"
        beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
        disabled={disabled}
        label={translate('text_6282085b4f283b0102655870')}
        placeholder={translate('text_62824f0e5d93bc008d268cf4')}
        value={localCharge.amount || ''}
        onChange={(value) => handleUpdate('amount', value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
          ),
        }}
      />
      <TextInput
        name="packageSize"
        beforeChangeFormatter={['positiveNumber', 'int']}
        error={_get(formikProps.errors, `charges.${chargeIndex}.packageSize`)}
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
            <InputAdornment position="end">
              {translate('text_6282085b4f283b0102655884')}
            </InputAdornment>
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
            <InputAdornment position="end">
              {translate('text_6282085b4f283b0102655894')}
            </InputAdornment>
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
                  currencyDisplay: 'symbol',
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
                    currencyDisplay: 'symbol',
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
                  currencyDisplay: 'symbol',
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
                  currencyDisplay: 'symbol',
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
