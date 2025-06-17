import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useState } from 'react'

import { Alert, Button, ChargeTable, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useGraduatedChargeForm } from '~/hooks/plans/useGraduatedChargeForm'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment GraduatedCharge on Properties {
    graduatedRanges {
      flatAmount
      fromValue
      perUnitAmount
      toValue
    }
  }
`

interface GraduatedChargeTableProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

const DisabledAmountCell = ({ amount, currency }: { amount?: string; currency: CurrencyEnum }) => (
  <div className="flex max-w-31 items-center gap-2 px-4">
    <Typography color="textSecondary">{getCurrencySymbol(currency)}</Typography>
    <Typography color="disabled" noWrap>
      {amount || '0.0'}
    </Typography>
  </div>
)

export const GraduatedChargeTable = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: GraduatedChargeTableProps) => {
    const { translate } = useInternationalization()
    const [errorIndex, setErrorIndex] = useState<number | undefined>()
    const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } =
      useGraduatedChargeForm({
        chargeIndex,
        disabled,
        formikProps,
        propertyCursor,
        valuePointer,
      })

    return (
      <div className="flex flex-col">
        <Button
          className="mb-2 ml-auto"
          startIcon="plus"
          variant="quaternary"
          onClick={addRange}
          disabled={disabled}
          data-test="add-tier"
        >
          {translate('text_62793bbb599f1c01522e91a5')}
        </Button>
        <div className="-mx-4 overflow-auto px-4 pb-6">
          <ChargeTable
            name="graduated-charge-table"
            data={tableDatas}
            onDeleteRow={(_, i) => deleteRange(i)}
            columns={[
              {
                size: 124,
                content: (_, i) => (
                  <Typography className="px-4" variant="captionHl">
                    {translate(
                      i === 0 ? 'text_62793bbb599f1c01522e91c0' : 'text_62793bbb599f1c01522e91fc',
                    )}
                  </Typography>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91ab')}
                  </Typography>
                ),
                size: 124,
                content: (row) => (
                  <Typography className="px-4" color="disabled" noWrap>
                    {row?.fromValue}
                  </Typography>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl" noWrap>
                    {translate('text_62793bbb599f1c01522e91b1')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled || i === tableDatas?.length - 1 ? (
                    <Typography className="px-4" variant="body" color="disabled" noWrap>
                      {row.toValue || '∞'}
                    </Typography>
                  ) : (
                    <Tooltip
                      placement="top"
                      title={translate('text_62793bbb599f1c01522e9232', {
                        value: row.fromValue - 1,
                      })}
                      disableHoverListener={errorIndex !== i}
                    >
                      <TextInput
                        variant="outlined"
                        error={errorIndex === i}
                        value={row.toValue as number | undefined}
                        beforeChangeFormatter={['int', 'positiveNumber']}
                        onBlur={() => {
                          if (
                            typeof row.toValue === 'string' &&
                            Number(row.toValue) < Number(row.fromValue)
                          ) {
                            setErrorIndex(i)
                          }
                        }}
                        onChange={(value) => {
                          if (typeof errorIndex === 'number') setErrorIndex(undefined)
                          handleUpdate(i, 'toValue', value)
                        }}
                      />
                    </Tooltip>
                  ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91b6')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell amount={row.perUnitAmount} currency={currency} />
                  ) : (
                    <AmountInput
                      variant="outlined"
                      beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                      currency={currency}
                      value={row.perUnitAmount}
                      onChange={(value) => handleUpdate(i, 'perUnitAmount', value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {getCurrencySymbol(currency)}
                          </InputAdornment>
                        ),
                      }}
                      data-test={`cell-amount-${i}`}
                    />
                  ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91bc')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell amount={row.flatAmount} currency={currency} />
                  ) : (
                    <AmountInput
                      variant="outlined"
                      beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                      currency={currency}
                      value={row.flatAmount}
                      onChange={(value) => handleUpdate(i, 'flatAmount', value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {getCurrencySymbol(currency)}
                          </InputAdornment>
                        ),
                      }}
                    />
                  ),
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Alert type="info">
            <>
              {infosCalculation.map((calculation, i) => {
                if (i === 0) {
                  return (
                    <Typography
                      variant="bodyHl"
                      key={`calculation-alert-${i}`}
                      color="textSecondary"
                    >
                      {translate('text_627b69c9fe95530136833956', {
                        lastRowUnit: calculation.firstUnit,
                        value: intlFormatNumber(calculation.total, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                      })}
                    </Typography>
                  )
                }
                if (i === 1) {
                  return infosCalculation.length === 2 ? (
                    <Typography key={`calculation-alert-${i}`} color="textSecondary">
                      {translate('text_64cac576a11db000acb130b2', {
                        tier1LastUnit: ONE_TIER_EXAMPLE_UNITS,
                        tier1PerUnit: intlFormatNumber(calculation.perUnit, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                        tier1FlatFee: intlFormatNumber(calculation.flatFee, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                        totalTier1: intlFormatNumber(calculation.total, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                      })}
                    </Typography>
                  ) : (
                    <Typography key={`calculation-alert-${i}`} color="textSecondary">
                      {translate('text_627b69c9fe95530136833958', {
                        tier1LastUnit: calculation.units,
                        tier1PerUnit: intlFormatNumber(calculation.perUnit, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                        tier1FlatFee: intlFormatNumber(calculation.flatFee, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                        totalTier1: intlFormatNumber(calculation.total, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                      })}
                    </Typography>
                  )
                }

                return (
                  <Typography key={`calculation-alert-${i}`} color="textSecondary">
                    {translate('text_627b69c9fe9553013683395a', {
                      unitCount: calculation.units,
                      tierPerUnit: intlFormatNumber(calculation.perUnit, {
                        currencyDisplay: 'symbol',
                        maximumFractionDigits: 15,
                        currency,
                      }),
                      tierFlatFee: intlFormatNumber(calculation.flatFee, {
                        currencyDisplay: 'symbol',
                        maximumFractionDigits: 15,
                        currency,
                      }),
                      totalTier: intlFormatNumber(calculation.total, {
                        currencyDisplay: 'symbol',
                        maximumFractionDigits: 15,
                        currency,
                      }),
                    })}
                  </Typography>
                )
              })}
            </>
          </Alert>

          <PricingGroupKeys
            disabled={disabled}
            handleUpdate={(name, value) => {
              formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
            }}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        </div>
      </div>
    )
  },
)

GraduatedChargeTable.displayName = 'GraduatedChargeTable'
