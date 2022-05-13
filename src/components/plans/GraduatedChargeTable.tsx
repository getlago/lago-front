import { useState } from 'react'
import styled from 'styled-components'
import { FormikProps } from 'formik'
import { InputAdornment } from '@mui/material'

import { theme } from '~/styles'
import { Table, Typography, Button, Tooltip, Alert } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import { CurrencyEnum } from '~/generated/graphql'
import { useGraduatedChargeForm } from '~/hooks/plans/useGraduatedChargeForm'
import { formatAmountToCurrency } from '~/core/currencyTool'

import { PlanFormInput } from './types'

interface GraduatedChargeTableProps {
  currency: CurrencyEnum
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  disabled?: boolean
}

export const GraduatedChargeTable = ({
  currency,
  chargeIndex,
  formikProps,
  disabled,
}: GraduatedChargeTableProps) => {
  const { translate } = useI18nContext()
  const [errorIndex, setErrorIndex] = useState<number | undefined>()
  const { tableDatas, addRange, handleUpdate, deleteRange, infosCaclucation } =
    useGraduatedChargeForm({
      formikProps,
      chargeIndex,
      disabled,
    })

  return (
    <Container>
      <AddButton startIcon="plus" variant="quaternary" onClick={addRange} disabled={disabled}>
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
                    <Typography color="textSecondary">{currency}</Typography>
                    <Typography color="disabled">{row.perUnitAmountCents}</Typography>
                  </DisabledAmountCell>
                ) : (
                  <CellAmount
                    disableDebounce
                    beforeChangeFormatter={['decimal', 'positiveNumber']}
                    placeholder="0.00"
                    value={row.perUnitAmountCents}
                    onChange={(value) => handleUpdate(i, 'perUnitAmountCents', value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                    }}
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
                    <Typography color="textSecondary">{currency}</Typography>
                    <Typography color="disabled">{row.flatAmountCents}</Typography>
                  </DisabledAmountCell>
                ) : (
                  <CellAmount
                    disableDebounce
                    beforeChangeFormatter={['decimal', 'positiveNumber']}
                    placeholder="0.00"
                    value={row.flatAmountCents}
                    onChange={(value) => handleUpdate(i, 'flatAmountCents', value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                    }}
                  />
                ),
            },
          ]}
        />
      </TableContainer>

      <Alert type="info">
        <>
          {infosCaclucation.map((calculation, i) => {
            if (i === 0) {
              return (
                <Typography variant="bodyHl" key={`calculation-alert-${i}`} color="textSecondary">
                  {translate('text_627b69c9fe95530136833956', {
                    lastRowUnit: calculation.firstUnit,
                    value: formatAmountToCurrency(calculation.totalCent, {
                      currencyDisplay: 'symbol',
                      initialUnit: 'standard',
                      currency,
                    }),
                  })}
                </Typography>
              )
            }
            if (i === 1) {
              return (
                <Typography key={`calculation-alert-${i}`} color="textSecondary">
                  {translate('text_627b69c9fe95530136833958', {
                    tier1LastUnit: calculation.units,
                    tier1PerUnit: formatAmountToCurrency(calculation.perUnitCent, {
                      currencyDisplay: 'symbol',
                      initialUnit: 'standard',
                      currency,
                    }),
                    tier1FlatFee: formatAmountToCurrency(calculation.flatFeeCent, {
                      currencyDisplay: 'symbol',
                      initialUnit: 'standard',
                      currency,
                    }),
                    totalTier1: formatAmountToCurrency(calculation.totalCent, {
                      currencyDisplay: 'symbol',
                      initialUnit: 'standard',
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
                  tierPerUnit: formatAmountToCurrency(calculation.perUnitCent, {
                    currencyDisplay: 'symbol',
                    initialUnit: 'standard',
                    currency,
                  }),
                  tierFlatFee: formatAmountToCurrency(calculation.flatFeeCent, {
                    currencyDisplay: 'symbol',
                    initialUnit: 'standard',
                    currency,
                  }),
                  totalTier: formatAmountToCurrency(calculation.totalCent, {
                    currencyDisplay: 'symbol',
                    initialUnit: 'standard',
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

const CellAmount = styled(TextInput)`
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
