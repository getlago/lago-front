import { gql } from '@apollo/client'
import { Box, InputAdornment, Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { FC, useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  Accordion,
  Alert,
  Button,
  ButtonLink,
  ChargeTable,
  Icon,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, Switch, TextInput } from '~/components/form'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import {
  IntegrationTypeEnum,
  useGetOrganizationIntegrationsForProgressiveBillingQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useProgressiveBillingForm } from '~/hooks/plans/useProgressiveBillingForm'
import { NAV_HEIGHT, theme } from '~/styles'

import { PlanFormInput } from './types'

gql`
  query GetOrganizationIntegrationsForProgressiveBilling {
    organization {
      premiumIntegrations
    }
  }
`

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
    handleUpdateThreshold,
  } = useProgressiveBillingForm({ formikProps })
  const { data } = useGetOrganizationIntegrationsForProgressiveBillingQuery()

  const [displayProgressiveBillingAccordion, setDisplayProgressiveBillingAccordion] = useState(
    !!formikProps.initialValues.usageThresholds,
  )
  const [displayRecurring, setRecurring] = useState(!!recurringData.length)
  const [errorIndex, setErrorIndex] = useState<number | undefined>()

  const hasErrorInGroup = !!formikProps?.errors?.usageThresholds
  const currency = formikProps.values.amountCurrency

  const hasPremiumIntegration = !!data?.organization?.premiumIntegrations?.includes(
    IntegrationTypeEnum.ProgressiveBilling,
  )

  useEffect(() => {
    let failedIndex = undefined
    const localData = formikProps.values.usageThresholds ?? []

    localData.every((row, index) => {
      if (
        (index > 0 && row.amountCents <= localData[index - 1].amountCents) ||
        row.amountCents === undefined
      ) {
        failedIndex = index
        return false
      }

      return true
    })

    setErrorIndex(failedIndex)
  }, [formikProps.values.usageThresholds])

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

      {!hasPremiumIntegration ? (
        <PremiumWarning>
          <Box>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1724345142892pcnx5m2k3r2')} <Icon name="sparkles" />
            </Typography>
            <Typography variant="caption">{translate('text_1724345142892ljzi79afhmc')}</Typography>
          </Box>
          <ButtonLink
            buttonProps={{
              variant: 'tertiary',
              size: 'medium',
              endIcon: 'sparkles',
            }}
            type="button"
            external
            to={`mailto:hello@getlago.com?subject=${translate('text_172434514289283gmf8bdhh3')}&body=${translate('text_1724346450317iqs2rtvx1tp')}`}
          >
            {translate('text_65ae73ebe3a66bec2b91d72d')}
          </ButtonLink>
        </PremiumWarning>
      ) : displayProgressiveBillingAccordion ? (
        <StyledAccordion
          initiallyOpen
          summary={
            <AccordionSummary
              hasErrorInGroup={hasErrorInGroup}
              onDelete={() => {
                deleteProgressiveBilling()
                setRecurring(false)
                setDisplayProgressiveBillingAccordion(false)
              }}
            />
          }
        >
          <Stack gap={6}>
            <Box display="flex" flexDirection="column">
              <AddButton startIcon="plus" variant="quaternary" onClick={addThreshold}>
                {translate('text_1724233213997l2ksi40t8q6')}
              </AddButton>
              <TableContainer>
                <ChargeTable
                  name="graduated-percentage-charge-table"
                  data={tableData.map((localData) => ({
                    ...localData,
                    disabledDelete: tableData.length === 1,
                  }))}
                  onDeleteRow={(_, i) => {
                    deleteThreshold({ index: i, isRecurring: false })
                  }}
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
                        <Tooltip
                          placement="top"
                          title={translate('text_1724252232460i4tv7384iiy', {
                            value: tableData[i - 1]?.amountCents,
                          })}
                          disableHoverListener={errorIndex !== i}
                        >
                          <CellAmount
                            error={errorIndex === i}
                            beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                            currency={currency}
                            value={row.amountCents}
                            onChange={(value) => {
                              handleUpdateThreshold({
                                index: i,
                                value: Number(value) || undefined,
                                isRecurring: false,
                                key: 'amountCents',
                              })

                              const previousRow = tableData[i - 1]

                              if (previousRow && previousRow.amountCents >= Number(value)) {
                                setErrorIndex(i)
                              } else {
                                setErrorIndex(undefined)
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  {getCurrencySymbol(currency)}
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Tooltip>
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
                          placeholder={translate('text_645bb193927b375079d28ace')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            handleUpdateThreshold({
                              index: i,
                              value: value === '' ? undefined : value,
                              isRecurring: false,
                              key: 'thresholdDisplayName',
                            })
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
                            beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                            currency={currency}
                            value={row.amountCents}
                            onChange={(value) =>
                              handleUpdateThreshold({
                                index: i,
                                value: Number(value) || undefined,
                                isRecurring: true,
                                key: 'amountCents',
                              })
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
                            placeholder={translate('text_645bb193927b375079d28ace')}
                            value={row.thresholdDisplayName ?? ''}
                            onChange={(value) => {
                              handleUpdateThreshold({
                                index: i,
                                value: value === '' ? undefined : value,
                                isRecurring: true,
                                key: 'thresholdDisplayName',
                              })
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

    .Mui-error {
      .MuiOutlinedInput-notchedOutline {
        border: 2px solid ${theme.palette.error.main};
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

const PremiumWarning = styled.div`
  background-color: ${theme.palette.grey[100]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing(4)} ${theme.spacing(6)};
  gap: ${theme.spacing(4)};
  border-radius: 8px;
`
