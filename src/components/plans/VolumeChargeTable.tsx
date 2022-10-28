import { useState } from 'react'
import styled from 'styled-components'
import { FormikProps } from 'formik'
import { InputAdornment } from '@mui/material'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { Table, Typography, Button, Tooltip, Alert } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useVolumeChargeForm } from '~/hooks/plans/useVolumeChargeForm'
import { intlFormatNumber, getCurrencySymbol } from '~/core/intlFormatNumber'

import { PlanFormInput } from './types'

gql`
  fragment VolumeRanges on Charge {
    properties {
      volumeRanges {
        flatAmount
        fromValue
        perUnitAmount
        toValue
      }
    }
    groupProperties {
      groupId
      values {
        volumeRanges {
          flatAmount
          fromValue
          perUnitAmount
          toValue
        }
      }
    }
  }
`

interface VolumeChargeTableProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const VolumeChargeTable = ({
  chargeIndex,
  currency,
  disabled,
  formikProps,
  propertyCursor,
  valuePointer,
}: VolumeChargeTableProps) => {
  const { translate } = useInternationalization()
  const [errorIndex, setErrorIndex] = useState<number | undefined>()
  const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } = useVolumeChargeForm(
    {
      chargeIndex,
      disabled,
      formikProps,
      propertyCursor,
      valuePointer,
    }
  )

  return (
    <Container>
      <AddButton startIcon="plus" variant="quaternary" onClick={addRange} disabled={disabled}>
        {translate('text_6304e74aab6dbc18d615f38e')}
      </AddButton>
      <TableContainer>
        <Table
          name="volume-charge-table"
          data={tableDatas}
          onDeleteRow={(_, i) => deleteRange(i)}
          columns={[
            {
              size: 124,
              content: () => (
                <DisabledCell variant="captionHl">
                  {translate('text_6304e74aab6dbc18d615f3a2')}
                </DisabledCell>
              ),
            },
            {
              title: (
                <DisabledCell variant="captionHl">
                  {translate('text_6304e74aab6dbc18d615f392')}
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
                  {translate('text_6304e74aab6dbc18d615f396')}
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
                    title={translate('text_6304e74aab6dbc18d615f420', {
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
                  {translate('text_6304e74aab6dbc18d615f39a')}
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
                    placeholder="0.00"
                    value={row.perUnitAmount}
                    onChange={(value) => handleUpdate(i, 'perUnitAmount', value)}
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
            {
              title: (
                <DisabledCell variant="captionHl">
                  {translate('text_6304e74aab6dbc18d615f39e')}
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
                    placeholder="0.00"
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
            value: intlFormatNumber(infosCalculation.value * 100, {
              currencyDisplay: 'symbol',
              maximumFractionDigits: 5,
              currency,
            }),
          })}
        </Typography>
        <Typography variant="body" color="textSecondary">
          {translate('text_6304e74aab6dbc18d615f416', {
            lastRowFirstUnit: infosCalculation.lastRowFirstUnit,
            lastRowPerUnit: intlFormatNumber(infosCalculation.lastRowPerUnit * 100, {
              currencyDisplay: 'symbol',
              maximumFractionDigits: 5,
              currency,
            }),
            lastRowFlatFee: intlFormatNumber(infosCalculation.lastRowFlatFee * 100, {
              currencyDisplay: 'symbol',
              maximumFractionDigits: 5,
              currency,
            }),
            value: intlFormatNumber(infosCalculation.value * 100, {
              currencyDisplay: 'symbol',
              maximumFractionDigits: 5,
              currency,
            }),
          })}
        </Typography>
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
