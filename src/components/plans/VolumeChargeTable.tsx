import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useState } from 'react'

import { Alert, Button, ChargeTable, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useVolumeChargeForm } from '~/hooks/plans/useVolumeChargeForm'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment VolumeRanges on VolumeRange {
    flatAmount
    fromValue
    perUnitAmount
    toValue
  }
`

interface VolumeChargeTableProps {
  chargeCursor: ChargeCursor
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
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

export const VolumeChargeTable = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: VolumeChargeTableProps) => {
    const { translate } = useInternationalization()
    const [errorIndex, setErrorIndex] = useState<number | undefined>()
    const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } =
      useVolumeChargeForm({
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
          {translate('text_6304e74aab6dbc18d615f38e')}
        </Button>
        <div className="-mx-4 overflow-auto px-4 pb-6">
          <ChargeTable
            name="volume-charge-table"
            data={tableDatas}
            onDeleteRow={(_, i) => deleteRange(i)}
            columns={[
              {
                size: 124,
                content: () => (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_6304e74aab6dbc18d615f3a2')}
                  </Typography>
                ),
              },
              {
                title: (
                  <Typography className="px-4" variant="captionHl">
                    {translate('text_6304e74aab6dbc18d615f392')}
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
                    {translate('text_6304e74aab6dbc18d615f396')}
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
                      title={translate('text_6304e74aab6dbc18d615f420', {
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
                    {translate('text_6304e74aab6dbc18d615f39a')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell currency={currency} amount={row.perUnitAmount} />
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
                            {chargePricingUnitShortName || getCurrencySymbol(currency)}
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
                    {translate('text_6304e74aab6dbc18d615f39e')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell currency={currency} amount={row.flatAmount} />
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
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_6304e74aab6dbc18d615f412', {
                lastRowFirstUnit: infosCalculation.lastRowFirstUnit,
                value: intlFormatNumber(infosCalculation.value, {
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 15,
                  currency,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
              })}
            </Typography>
            <Typography variant="body" color="textSecondary">
              {translate('text_6304e74aab6dbc18d615f416', {
                lastRowFirstUnit: infosCalculation.lastRowFirstUnit,
                lastRowPerUnit: intlFormatNumber(infosCalculation.lastRowPerUnit, {
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 15,
                  currency,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
                lastRowFlatFee: intlFormatNumber(infosCalculation.lastRowFlatFee, {
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 15,
                  currency,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
                value: intlFormatNumber(infosCalculation.value, {
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 15,
                  currency,
                  pricingUnitShortName: chargePricingUnitShortName,
                }),
              })}
            </Typography>
          </Alert>
        </div>
      </div>
    )
  },
)

VolumeChargeTable.displayName = 'VolumeChargeTable'
