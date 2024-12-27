import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useState } from 'react'
import styled from 'styled-components'

import { Alert, Button, ChargeTable, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useVolumeChargeForm } from '~/hooks/plans/useVolumeChargeForm'
import { theme } from '~/styles'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

gql`
  fragment VolumeRanges on Properties {
    volumeRanges {
      flatAmount
      fromValue
      perUnitAmount
      toValue
    }
  }
`

interface VolumeChargeTableProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const VolumeChargeTable = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: VolumeChargeTableProps) => {
    const { translate } = useInternationalization()
    const [errorIndex, setErrorIndex] = useState<number | undefined>()
    const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } =
      useVolumeChargeForm({
        chargeIndex,
        disabled,
        formikProps,
        propertyCursor,
        valuePointer,
      })

    return (
      <Container>
        <Button
          className="mb-2 ml-auto"
          startIcon="plus"
          variant="quaternary"
          onClick={addRange}
          disabled={disabled}
          data-test="add-tier"
        >
          {translate('text_6304e74aab6dbc18d615f38e')}
        </Button>
        <TableContainer>
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
                    <DisabledAmountCell>
                      <Typography color="textSecondary">{getCurrencySymbol(currency)}</Typography>
                      <Typography color="disabled" noWrap>
                        {row.perUnitAmount || '0.0'}
                      </Typography>
                    </DisabledAmountCell>
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
                    {translate('text_6304e74aab6dbc18d615f39e')}
                  </Typography>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell>
                      <Typography color="textSecondary">{getCurrencySymbol(currency)}</Typography>
                      <Typography color="disabled" noWrap>
                        {row.flatAmount || '0.0'}
                      </Typography>
                    </DisabledAmountCell>
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
        </TableContainer>

        <Alert type="info">
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_6304e74aab6dbc18d615f412', {
              lastRowFirstUnit: infosCalculation.lastRowFirstUnit,
              value: intlFormatNumber(infosCalculation.value, {
                currencyDisplay: 'symbol',
                maximumFractionDigits: 15,
                currency,
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
              }),
              lastRowFlatFee: intlFormatNumber(infosCalculation.lastRowFlatFee, {
                currencyDisplay: 'symbol',
                maximumFractionDigits: 15,
                currency,
              }),
              value: intlFormatNumber(infosCalculation.value, {
                currencyDisplay: 'symbol',
                maximumFractionDigits: 15,
                currency,
              }),
            })}
          </Typography>
        </Alert>
      </Container>
    )
  },
)

VolumeChargeTable.displayName = 'VolumeChargeTable'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const TableContainer = styled.div`
  overflow: auto;
  padding-right: ${theme.spacing(4)};
  margin-left: -${theme.spacing(4)};
  margin-right: -${theme.spacing(4)};
  padding-left: ${theme.spacing(4)};
  padding-bottom: ${theme.spacing(6)};
`

const DisabledAmountCell = styled.div`
  max-width: 124px;
  padding: 0px ${theme.spacing(4)};
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`
