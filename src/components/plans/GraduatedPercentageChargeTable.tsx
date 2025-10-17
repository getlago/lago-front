import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { memo, useState } from 'react'

import { Alert, Button, ChargeTable, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useGraduatedPercentageChargeForm } from '~/hooks/plans/useGraduatedPercentageChargeForm'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment GraduatedPercentageCharge on GraduatedPercentageRange {
    flatAmount
    fromValue
    rate
    toValue
  }
`

interface GraduatedPercentageChargeTableProps {
  chargeCursor: ChargeCursor
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

const DisabledAmountCell = ({
  amount,
  currency,
  pricingUnitShortName,
}: {
  amount?: string
  currency: CurrencyEnum
  pricingUnitShortName?: string
}) => (
  <div className="flex max-w-31 items-center gap-2 px-4">
    <Typography color="textSecondary">
      {pricingUnitShortName || getCurrencySymbol(currency)}
    </Typography>
    <Typography color="disabled" noWrap>
      {amount || '0.0'}
    </Typography>
  </div>
)

export const GraduatedPercentageChargeTable = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: GraduatedPercentageChargeTableProps) => {
    const { translate } = useInternationalization()
    const [errorIndex, setErrorIndex] = useState<number | undefined>()
    const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } =
      useGraduatedPercentageChargeForm({
        chargeCursor,
        chargeIndex,
        disabled,
        propertyCursor,
        setFieldValue,
        valuePointer,
      })

    return (
      <div className="flex flex-col">
        <Button
          className="mb-2 ml-auto"
          startIcon="plus"
          variant="inline"
          onClick={addRange}
          disabled={disabled}
          data-test="add-tier"
        >
          {translate('text_62793bbb599f1c01522e91a5')}
        </Button>
        <div className="-mx-4 overflow-auto px-4 pb-6">
          <ChargeTable
            name="graduated-percentage-charge-table"
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
                    {translate('text_64de472463e2da6b31737de0')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <Typography
                      className="flex max-w-31 items-center gap-2 px-4"
                      color="disabled"
                      noWrap
                    >
                      {intlFormatNumber(Number(row.rate) / 100 || 0, {
                        maximumFractionDigits: 15,
                        style: 'percent',
                      })}
                    </Typography>
                  ) : (
                    <AmountInput
                      variant="outlined"
                      beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                      currency={currency}
                      value={row.rate}
                      onChange={(value) => handleUpdate(i, 'rate', value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_632d68358f1fedc68eed3e93')}
                          </InputAdornment>
                        ),
                      }}
                      data-test={`cell-rate-${i}`}
                    />
                  ),
              },
              {
                title: (
                  <div className="flex items-center">
                    <Typography className="px-4" variant="captionHl">
                      {translate('text_64de472463e2da6b31737df2')}
                    </Typography>
                    <Tooltip
                      className="flex h-5 items-end"
                      placement="top-end"
                      title={translate('text_64de472563e2da6b31737e77')}
                    >
                      <Icon name="info-circle" />
                    </Tooltip>
                  </div>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell
                      amount={row.flatAmount}
                      currency={currency}
                      pricingUnitShortName={chargePricingUnitShortName}
                    />
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
                            {chargePricingUnitShortName || getCurrencySymbol(currency)}
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
                  // When only one tier
                  return infosCalculation.length === 1 ? (
                    <Typography key={`calculation-alert-${i}`} color="textSecondary">
                      {translate('text_64de5dd470cdf80100c15fdb', {
                        rate: intlFormatNumber(calculation.rate / 100, {
                          maximumFractionDigits: 15,
                          style: 'percent',
                        }),
                        flatAmount: intlFormatNumber(calculation.flatAmount, {
                          pricingUnitShortName: chargePricingUnitShortName,
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 15,
                          currency,
                        }),
                      })}
                    </Typography>
                  ) : (
                    <Typography key={`calculation-alert-${i}`} color="textSecondary">
                      {translate('text_64de472563e2da6b31737e6f', {
                        units: calculation.units,
                        rate: intlFormatNumber(calculation.rate / 100, {
                          maximumFractionDigits: 15,
                          style: 'percent',
                        }),
                        flatAmount: intlFormatNumber(calculation.flatAmount, {
                          pricingUnitShortName: chargePricingUnitShortName,
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
                    {translate('text_64de472563e2da6b31737e75', {
                      units: calculation.units,
                      rate: intlFormatNumber(calculation.rate / 100, {
                        maximumFractionDigits: 15,
                        style: 'percent',
                      }),
                      flatAmount: intlFormatNumber(calculation.flatAmount, {
                        pricingUnitShortName: chargePricingUnitShortName,
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
        </div>
      </div>
    )
  },
)

GraduatedPercentageChargeTable.displayName = 'GraduatedPercentageChargeTable'
