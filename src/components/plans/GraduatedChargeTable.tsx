import { useState } from 'react'
import styled from 'styled-components'
import { FormikProps } from 'formik'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { Table, Typography, Button, Tooltip, Alert } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useGraduatedChargeForm } from '~/hooks/plans/useGraduatedChargeForm'
import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { ONE_TIER_EXAMPLE_UNITS } from '~/core/constants/form'

import { PlanFormInput } from './types'

gql`
  fragment GraduatedCharge on Charge {
    id
    properties {
      graduatedRanges {
        flatAmount
        fromValue
        perUnitAmount
        toValue
      }
    }
    groupProperties {
      groupId
      values {
        graduatedRanges {
          flatAmount
          fromValue
          perUnitAmount
          toValue
        }
      }
    }
  }
`

interface GraduatedChargeTableProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const GraduatedChargeTable = ({
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
    <Container>
      <AddButton
        startIcon="plus"
        variant="quaternary"
        onClick={addRange}
        disabled={disabled}
        data-test="add-tier"
      >
        {translate('text_62793bbb599f1c01522e91a5')}
      </AddButton>
      <TableContainer>
        <Table
          name="graduated-charge-table"
          data={tableDatas}
          onDeleteRow={(_, i) => deleteRange(i)}
          columns={[
            {
              size: 124,
              content: (_, i) => (
                <DisabledCell variant="captionHl">
                  {translate(
                    i === 0 ? 'text_62793bbb599f1c01522e91c0' : 'text_62793bbb599f1c01522e91fc'
                  )}
                </DisabledCell>
              ),
            },
            {
              title: (
                <DisabledCell variant="captionHl">
                  {translate('text_62793bbb599f1c01522e91ab')}
                </DisabledCell>
              ),
              size: 124,
              content: (row) => (
                <DisabledCell color="disabled" noWrap>
                  {row?.fromValue}
                </DisabledCell>
              ),
            },
            {
              title: (
                <DisabledCell variant="captionHl" noWrap>
                  {translate('text_62793bbb599f1c01522e91b1')}
                </DisabledCell>
              ),
              size: 124,
              content: (row, i) =>
                disabled || i === tableDatas?.length - 1 ? (
                  <DisabledCell variant="body" color="disabled" noWrap>
                    {row.toValue || '∞'}
                  </DisabledCell>
                ) : (
                  <Tooltip
                    placement="top"
                    title={translate('text_62793bbb599f1c01522e9232', {
                      value: row.fromValue - 1,
                    })}
                    disableHoverListener={errorIndex !== i}
                  >
                    <CellInput
                      error={errorIndex === i}
                      value={row.toValue as number | undefined}
                      beforeChangeFormatter={['int', 'positiveNumber']}
                      onBlur={() => {
                        if (typeof row.toValue === 'number' && row.toValue < row.fromValue) {
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
                <DisabledCell variant="captionHl">
                  {translate('text_62793bbb599f1c01522e91b6')}
                </DisabledCell>
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
                  <CellAmount
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
                <DisabledCell variant="captionHl">
                  {translate('text_62793bbb599f1c01522e91bc')}
                </DisabledCell>
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
                  <CellAmount
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
        <>
          {infosCalculation.map((calculation, i) => {
            if (i === 0) {
              return (
                <Typography variant="bodyHl" key={`calculation-alert-${i}`} color="textSecondary">
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
    </Container>
  )
}

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

const DisabledCell = styled(Typography)`
  padding: 0px ${theme.spacing(4)};
`

const DisabledAmountCell = styled.div`
  max-width: 124px;
  padding: 0px ${theme.spacing(4)};
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const CellInput = styled(TextInput)`
  && {
    > * {
      margin-bottom: 0;
    }
    .MuiOutlinedInput-notchedOutline {
      border: none;
    }

    .Mui-focused {
      z-index: 1;
      .MuiOutlinedInput-notchedOutline {
        border: 2px solid ${theme.palette.primary.main};
      }
    }

    .Mui-error {
      .MuiOutlinedInput-notchedOutline {
        border: 2px solid ${theme.palette.error.main};
      }
    }
  }
`

const CellAmount = styled(AmountInput)`
  && {
    > * {
      margin-bottom: 0;
    }
    .MuiOutlinedInput-notchedOutline {
      border: none;
    }

    .Mui-focused {
      z-index: 1;
      .MuiOutlinedInput-notchedOutline {
        border: 2px solid ${theme.palette.primary.main};
      }
    }
  }
`

const AddButton = styled(Button)`
  margin-left: auto;
  margin-bottom: ${theme.spacing(2)};
`
