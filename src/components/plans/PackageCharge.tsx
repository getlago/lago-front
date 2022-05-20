import { useCallback, useEffect } from 'react'
import { FormikProps } from 'formik'
import styled from 'styled-components'
import _get from 'lodash/get'
import { InputAdornment } from '@mui/material'

import { ComboBox, TextInput } from '~/components/form'
import { Alert, Typography } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme } from '~/styles'
import { CurrencyEnum } from '~/generated/graphql'
import { formatAmountToCurrency } from '~/core/currencyTool'

import { PlanFormInput } from './types'

interface PackageChargeProps {
  disabled?: boolean
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
}

export const PackageCharge = ({ disabled, chargeIndex, formikProps }: PackageChargeProps) => {
  const { translate } = useI18nContext()
  const localCharge = formikProps.values.charges[chargeIndex]

  const handleUpdate = useCallback(
    (name, value) => {
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
      <LineAmount>
        <TextInput
          name="amountCents"
          beforeChangeFormatter={['positiveNumber', 'decimal']}
          disabled={disabled}
          label={translate('text_6282085b4f283b0102655870')}
          placeholder={translate('text_62824f0e5d93bc008d268cf4')}
          value={localCharge.amountCents as number | undefined}
          onChange={(value) => handleUpdate('amountCents', value)}
        />
        <ComboBox
          name="amountCurrency"
          disabled
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          disableClearable
          value={localCharge.amountCurrency}
          onChange={() => {}}
        />
      </LineAmount>
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
                cost: formatAmountToCurrency((localCharge.amountCents || 0) * 2, {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  currency: localCharge.amountCurrency,
                }),
              })}
            </Typography>
            {!!localCharge.freeUnits && (
              <Typography color="textSecondary">
                {translate('text_6282085b4f283b0102655896', {
                  unit: 1,
                  unitInPackage: localCharge.freeUnits,
                  cost: formatAmountToCurrency(0, {
                    currencyDisplay: 'code',
                    initialUnit: 'standard',
                    currency: localCharge.amountCurrency,
                  }),
                })}
              </Typography>
            )}

            <Typography color="textSecondary">
              {translate('text_6282085b4f283b0102655896', {
                unit: (localCharge.freeUnits || 0) + 1,
                unitInPackage: localCharge.packageSize + (localCharge.freeUnits || 0),
                cost: formatAmountToCurrency(localCharge.amountCents || 0, {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  currency: localCharge.amountCurrency,
                }),
              })}
            </Typography>
            <Typography color="textSecondary">
              {translate('text_6282085b4f283b0102655896', {
                unit: (localCharge.freeUnits || 0) + localCharge.packageSize + 1,
                unitInPackage: localCharge.packageSize * 2 + (localCharge.freeUnits || 0),
                cost: formatAmountToCurrency((localCharge.amountCents || 0) * 2, {
                  currencyDisplay: 'code',
                  initialUnit: 'standard',
                  currency: localCharge.amountCurrency,
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
