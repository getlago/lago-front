import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useState } from 'react'
import styled from 'styled-components'

import { Alert, Button, ChargeTable, Icon, Tooltip, Typography } from '~/components/designSystem'
import { AmountInput, TextInput } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useGraduatedPercentageChargeForm } from '~/hooks/plans/useGraduatedPercentageChargeForm'
import { theme } from '~/styles'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

gql`
  fragment GraduatedPercentageCharge on Properties {
    graduatedPercentageRanges {
      flatAmount
      fromValue
      rate
      toValue
    }
  }
`

interface GraduatedPercentageChargeTableProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const GraduatedPercentageChargeTable = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: GraduatedPercentageChargeTableProps) => {
    const { translate } = useInternationalization()
    const [errorIndex, setErrorIndex] = useState<number | undefined>()
    const { tableDatas, addRange, handleUpdate, deleteRange, infosCalculation } =
      useGraduatedPercentageChargeForm({
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
          <ChargeTable
            name="graduated-percentage-charge-table"
            data={tableDatas}
            onDeleteRow={(_, i) => deleteRange(i)}
            columns={[
              {
                size: 124,
                content: (_, i) => (
                  <TypographyCell variant="captionHl">
                    {translate(
                      i === 0 ? 'text_62793bbb599f1c01522e91c0' : 'text_62793bbb599f1c01522e91fc',
                    )}
                  </TypographyCell>
                ),
              },
              {
                title: (
                  <TypographyCell variant="captionHl">
                    {translate('text_62793bbb599f1c01522e91ab')}
                  </TypographyCell>
                ),
                size: 124,
                content: (row) => (
                  <TypographyCell color="disabled" noWrap>
                    {row?.fromValue}
                  </TypographyCell>
                ),
              },
              {
                title: (
                  <TypographyCell variant="captionHl" noWrap>
                    {translate('text_62793bbb599f1c01522e91b1')}
                  </TypographyCell>
                ),
                size: 124,
                content: (row, i) =>
                  disabled || i === tableDatas?.length - 1 ? (
                    <TypographyCell variant="body" color="disabled" noWrap>
                      {row.toValue || '∞'}
                    </TypographyCell>
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
                  <TypographyCell variant="captionHl">
                    {translate('text_64de472463e2da6b31737de0')}
                  </TypographyCell>
                ),
                size: 124,
                content: (row, i) =>
                  disabled ? (
                    <DisabledAmountCell>
                      <Typography color="disabled" noWrap>
                        {row.rate || '0.00'}
                      </Typography>
                      <Typography color="textSecondary">{getCurrencySymbol(currency)}</Typography>
                    </DisabledAmountCell>
                  ) : (
                    <CellAmount
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
                    <TypographyCell variant="captionHl">
                      {translate('text_64de472463e2da6b31737df2')}
                    </TypographyCell>
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
                // When only one tier
                return infosCalculation.length === 1 ? (
                  <Typography key={`calculation-alert-${i}`} color="textSecondary">
                    {translate('text_64de5dd470cdf80100c15fdb', {
                      rate: intlFormatNumber(calculation.rate / 100, {
                        maximumFractionDigits: 15,
                        style: 'percent',
                      }),
                      flatAmount: intlFormatNumber(calculation.flatAmount, {
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
  },
)

GraduatedPercentageChargeTable.displayName = 'GraduatedPercentageChargeTable'

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

const TypographyCell = styled(Typography)`
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
  .MuiInputBase-formControl {
    border-radius: 0;
  }

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
  .MuiInputBase-formControl {
    border-radius: 0;
  }

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
