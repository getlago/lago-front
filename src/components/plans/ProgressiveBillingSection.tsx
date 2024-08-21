import { Box, InputAdornment, Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { FC, useState } from 'react'
import styled from 'styled-components'

import {
  Accordion,
  Alert,
  Button,
  ChargeTable,
  Icon,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, Switch, TextInput } from '~/components/form'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useProgressiveBillingForm } from '~/hooks/plans/useProgressiveBillingForm'
import { NAV_HEIGHT, theme } from '~/styles'

import { PlanFormInput } from './types'

interface ProgressiveBillingSectionProps {
  formikProps: FormikProps<PlanFormInput>
}

export const ProgressiveBillingSection: FC<ProgressiveBillingSectionProps> = ({ formikProps }) => {
  const { translate } = useInternationalization()
  const {
    tableData,
    recurringData,
    deleteProgressiveBilling,
    addThreshold,
    deleteThreshold,
    addRecurring,
  } = useProgressiveBillingForm({ formikProps })

  const [displayProgressiveBillingAccordion, setDisplayProgressiveBillingAccordion] = useState(
    !!formikProps.initialValues.usageThresholds,
  )
  const [displayRecurring, setRecurring] = useState(!!recurringData.length)

  const hasErrorInGroup = false
  const currency = formikProps.values.amountCurrency

  return (
    <Stack gap={4} alignItems="flex-start">
      <SectionTitle>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1724179887722baucvj7bvc1')}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
        />
      </SectionTitle>

      {displayProgressiveBillingAccordion ? (
        <StyledAccordion
          initiallyOpen
          summary={
            <AccordionSummary
              hasErrorInGroup={hasErrorInGroup}
              onDelete={() => {
                deleteProgressiveBilling()
                setDisplayProgressiveBillingAccordion(false)
              }}
            />
          }
        >
          <Stack gap={6}>
            <Box>
              <AddButton startIcon="plus" variant="quaternary" onClick={addThreshold}>
                {translate('text_1724233213997l2ksi40t8q6')}
              </AddButton>
              <TableContainer>
                <ChargeTable
                  name="graduated-percentage-charge-table"
                  data={tableData}
                  onDeleteRow={(_, i) => deleteThreshold({ index: i, isRecurring: false })}
                  deleteTooltipContent="text_17242522324608198c2vblmw"
                  columns={[
                    {
                      size: 224,
                      content: (_, i) => (
                        <TypographyCell variant="captionHl" noWrap>
                          {translate(
                            i === 0
                              ? 'text_1724234174944p8zi54j192m'
                              : 'text_1724179887723917j8ezkd9v',
                          )}
                        </TypographyCell>
                      ),
                    },
                    {
                      size: 197,
                      title: (
                        <TypographyCell variant="captionHl">
                          {translate('text_1724179887723eh12a0kqbdw')}
                        </TypographyCell>
                      ),
                      content: (row, i) => (
                        <CellAmount
                          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                          currency={currency}
                          value={deserializeAmount(row.amountCents, currency)}
                          onChange={(value) =>
                            formikProps.setFieldValue(`usageThresholds[${i}].amountCents`, value)
                          }
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
                      size: 197,
                      title: (
                        <TypographyCell variant="captionHl">
                          {translate('text_17241798877234jhvoho4ci9')}
                        </TypographyCell>
                      ),
                      content: (row, i) => (
                        <CellInput
                          placeholder={translate('Type a name')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            formikProps.setFieldValue(
                              `usageThresholds[${i}].thresholdDisplayName`,
                              value,
                            )
                          }}
                        />
                      ),
                    },
                  ]}
                />
              </TableContainer>
            </Box>
            <Switch
              name="progressiveBillingRecurring"
              checked={displayRecurring}
              onChange={() => {
                if (!displayRecurring) {
                  addRecurring()
                } else {
                  deleteThreshold({ index: 0, isRecurring: true })
                }
                setRecurring(!displayRecurring)
              }}
              label={translate('text_1724234174945ztq15pvmty3')}
              subLabel={translate('text_172423417494563qf45qet2d')}
            />
            {displayRecurring && (
              <>
                <TableContainer>
                  <ChargeTable
                    name={''}
                    columns={[
                      {
                        size: 224,
                        content: () => (
                          <TypographyCell variant="captionHl" noWrap>
                            {translate('text_17241798877230y851fdxzqu')}
                          </TypographyCell>
                        ),
                      },
                      {
                        size: 197,
                        content: (row, i) => (
                          <CellAmount
                            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
                            currency={currency}
                            value={deserializeAmount(row.amountCents, currency)}
                            onChange={(value) =>
                              formikProps.setFieldValue(`usageThresholds[${i}].amountCents`, value)
                            }
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
                        size: 197,
                        content: (row, i) => (
                          <CellInput
                            placeholder={translate('Type a name')}
                            value={row.thresholdDisplayName ?? ''}
                            onChange={(value) => {
                              formikProps.setFieldValue(
                                `usageThresholds[${i}].thresholdDisplayName`,
                                value,
                              )
                            }}
                          />
                        ),
                      },
                    ]}
                    data={recurringData}
                  />
                </TableContainer>

                <Alert type="info">{translate('text_172423417494563qf45qet2d')}</Alert>
              </>
            )}
          </Stack>
        </StyledAccordion>
      ) : (
        <Button
          variant="quaternary"
          startIcon="plus"
          disabled={displayProgressiveBillingAccordion}
          onClick={() => {
            addThreshold()
            setDisplayProgressiveBillingAccordion(true)
          }}
        >
          {translate('text_1724233213996upb98e8b8xx')}
        </Button>
      )}
    </Stack>
  )
}

ProgressiveBillingSection.displayName = 'ProgressiveBillingSection'

const AccordionSummary: FC<{ onDelete: VoidFunction; hasErrorInGroup: boolean }> = ({
  onDelete,
  hasErrorInGroup,
}) => {
  const { translate } = useInternationalization()

  return (
    <BoxHeader>
      <BoxHeaderGroupLeft>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1724179887722baucvj7bvc1')}
        </Typography>
      </BoxHeaderGroupLeft>

      <BoxHeaderGroupRight>
        <Tooltip
          placement="top-end"
          title={
            hasErrorInGroup
              ? translate('text_635b975ecea4296eb76924b7')
              : translate('text_635b975ecea4296eb76924b1')
          }
        >
          <ValidationIcon name="validate-filled" color={hasErrorInGroup ? 'disabled' : 'success'} />
        </Tooltip>

        <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
          <Button size="small" icon="trash" variant="quaternary" onClick={onDelete} />
        </Tooltip>
      </BoxHeaderGroupRight>
    </BoxHeader>
  )
}

const SectionTitle = styled.div`
  > div:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const BoxHeader = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  width: 100%;
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing(3)};
`

const BoxHeaderGroupLeft = styled.div`
  /* Used to prevent long invoice display name to overflow */
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  /* Padding added to prevent overflow hidden to crop the focus ring */
  box-sizing: border-box;
  padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} 0;
`

const BoxHeaderGroupRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const ValidationIcon = styled(Icon)`
  display: flex;
  align-items: center;
`

const StyledAccordion = styled(Accordion)`
  width: 100%;
`

const AddButton = styled(Button)`
  margin-left: auto;
  margin-bottom: ${theme.spacing(2)};
`

const TableContainer = styled.div`
  overflow: auto;
  padding-right: ${theme.spacing(4)};
  margin-left: -${theme.spacing(4)};
  margin-right: -${theme.spacing(4)};
  padding-left: ${theme.spacing(4)};
`

const TypographyCell = styled(Typography)`
  padding: 0px ${theme.spacing(4)};
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
