import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps, FormikState } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback } from 'react'

import { Alert, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment PackageCharge on Properties {
    amount
    packageSize
    freeUnits
  }
`

interface PackageChargeProps {
  chargeCursor: ChargeCursor
  chargeErrors: FormikState<PlanFormInput>['errors']
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const PackageCharge = memo(
  ({
    chargeCursor,
    chargeErrors,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: PackageChargeProps) => {
    const { translate } = useInternationalization()
    const handleUpdate = useCallback(
      (name: string, value: string | string[]) => {
        setFieldValue(`${chargeCursor}.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    const serializedPackageCharge = Number(valuePointer?.packageSize || 0)
    const serializedFreeUnits = Number(valuePointer?.freeUnits || 0)

    return (
      <>
        <AmountInput
          name={`${propertyCursor}.amount`}
          currency={currency}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          label={translate('text_6282085b4f283b0102655870')}
          value={valuePointer?.amount || ''}
          onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {chargePricingUnitShortName || getCurrencySymbol(currency)}
              </InputAdornment>
            ),
          }}
        />
        <TextInput
          name={`${propertyCursor}.packageSize`}
          beforeChangeFormatter={['positiveNumber', 'int']}
          error={_get(chargeErrors, `${chargeCursor}.${chargeIndex}.${propertyCursor}.packageSize`)}
          disabled={disabled}
          value={serializedPackageCharge}
          onChange={(value) => handleUpdate(`${propertyCursor}.packageSize`, value)}
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
          name={`${propertyCursor}.freeUnits`}
          label={translate('text_6282085b4f283b010265588c')}
          placeholder={translate('text_62824f0e5d93bc008d268d00')}
          beforeChangeFormatter={['positiveNumber', 'int']}
          disabled={disabled}
          value={serializedFreeUnits}
          onChange={(value) => handleUpdate(`${propertyCursor}.freeUnits`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_6282085b4f283b0102655894')}
              </InputAdornment>
            ),
          }}
        />
        <Alert type="info">
          {!valuePointer?.packageSize ? (
            <Typography color="textSecondary">
              {translate('text_6282085b4f283b0102655898')}
            </Typography>
          ) : (
            <>
              <Typography variant="bodyHl" color="textSecondary">
                {translate('text_6282085b4f283b0102655892', {
                  units: serializedPackageCharge + serializedFreeUnits + 1,
                  cost: intlFormatNumber(Number(valuePointer?.amount || 0) * 2, {
                    currencyDisplay: 'symbol',
                    maximumFractionDigits: 15,
                    currency,
                    pricingUnitShortName: chargePricingUnitShortName,
                  }),
                })}
              </Typography>
              {!!valuePointer?.freeUnits && (
                <Typography color="textSecondary">
                  {translate('text_6282085b4f283b0102655896', {
                    unit: 1,
                    unitInPackage: serializedFreeUnits,
                    cost: intlFormatNumber(0, {
                      currencyDisplay: 'symbol',
                      maximumFractionDigits: 15,
                      currency,
                      pricingUnitShortName: chargePricingUnitShortName,
                    }),
                  })}
                </Typography>
              )}

              <Typography color="textSecondary">
                {translate('text_6282085b4f283b0102655896', {
                  unit: serializedFreeUnits + 1,
                  unitInPackage: serializedPackageCharge + serializedFreeUnits,
                  cost: intlFormatNumber(Number(valuePointer?.amount || 0), {
                    currencyDisplay: 'symbol',
                    maximumFractionDigits: 15,
                    currency,
                    pricingUnitShortName: chargePricingUnitShortName,
                  }),
                })}
              </Typography>
              <Typography color="textSecondary">
                {translate('text_6282085b4f283b0102655896', {
                  unit: serializedFreeUnits + serializedPackageCharge + 1,
                  unitInPackage: serializedPackageCharge * 2 + serializedFreeUnits,
                  cost: intlFormatNumber(Number(valuePointer?.amount || 0) * 2, {
                    currencyDisplay: 'symbol',
                    maximumFractionDigits: 15,
                    currency,
                    pricingUnitShortName: chargePricingUnitShortName,
                  }),
                })}
              </Typography>
            </>
          )}
        </Alert>
      </>
    )
  },
)

PackageCharge.displayName = 'PackageCharge'
