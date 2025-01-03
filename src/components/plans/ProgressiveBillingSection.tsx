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
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useProgressiveBillingForm } from '~/hooks/plans/useProgressiveBillingForm'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { NAV_HEIGHT, theme } from '~/styles'

import { PlanFormInput } from './types'

interface ProgressiveBillingSectionProps {
  formikProps: FormikProps<PlanFormInput>
  isInSubscriptionForm?: boolean
}

export const ProgressiveBillingSection: FC<ProgressiveBillingSectionProps> = ({
  formikProps,
  isInSubscriptionForm,
}) => {
  const { translate } = useInternationalization()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const {
    nonRecurringUsageThresholds,
    recurringUsageThreshold,
    hasErrorInGroup,
    errorIndex,
    deleteProgressiveBilling,
    deleteThreshold,
    addNonRecurringThreshold,
    addRecurringThreshold,
    updateThreshold,
  } = useProgressiveBillingForm({ formikProps })

  const [displayProgressiveBillingAccordion, setDisplayProgressiveBillingAccordion] = useState(
    !!nonRecurringUsageThresholds?.length || !!recurringUsageThreshold,
  )
  const [displayRecurring, setRecurring] = useState(!!recurringUsageThreshold)

  const currency = formikProps.values.amountCurrency

  const hasPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  useEffect(() => {
    setDisplayProgressiveBillingAccordion(
      !!formikProps.initialValues.nonRecurringUsageThresholds?.length ||
        !!formikProps.initialValues.recurringUsageThreshold,
    )
    setRecurring(!!formikProps.initialValues.recurringUsageThreshold)
  }, [
    formikProps.initialValues.nonRecurringUsageThresholds,
    formikProps.initialValues.recurringUsageThreshold,
  ])

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
        <Accordion
          className="w-full"
          initiallyOpen={!isInSubscriptionForm}
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
              <Button
                className="mb-2 ml-auto"
                startIcon="plus"
                variant="quaternary"
                onClick={addNonRecurringThreshold}
              >
                {translate('text_1724233213997l2ksi40t8q6')}
              </Button>
              <TableContainer>
                <ChargeTable
                  name="graduated-percentage-charge-table"
                  data={(nonRecurringUsageThresholds ?? []).map((localData) => ({
                    ...localData,
                    disabledDelete: nonRecurringUsageThresholds?.length === 1,
                  }))}
                  onDeleteRow={(_, i) => {
                    deleteThreshold({ index: i, isRecurring: false })
                  }}
                  deleteTooltipContent={translate('text_17242522324608198c2vblmw')}
                  columns={[
                    {
                      size: 224,
                      content: (_, i) => (
                        <Typography className="px-4" variant="captionHl" noWrap>
                          {translate(
                            i === 0
                              ? 'text_1724234174944p8zi54j192m'
                              : 'text_1724179887723917j8ezkd9v',
                          )}
                        </Typography>
                      ),
                    },
                    {
                      size: 197,
                      title: (
                        <Typography className="px-4" variant="captionHl">
                          {translate('text_1724179887723eh12a0kqbdw')}
                        </Typography>
                      ),
                      content: (row, i) => (
                        <Tooltip
                          placement="top"
                          title={translate('text_1724252232460i4tv7384iiy', {
                            value: nonRecurringUsageThresholds?.[i - 1]?.amountCents,
                          })}
                          disableHoverListener={errorIndex !== i}
                        >
                          <AmountInput
                            variant="outlined"
                            error={errorIndex === i}
                            beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                            currency={currency}
                            value={row.amountCents}
                            onChange={(value) => {
                              updateThreshold({
                                index: i,
                                value: Number(value) || undefined,
                                isRecurring: false,
                                key: 'amountCents',
                              })
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
                        <Typography className="px-4" variant="captionHl">
                          {translate('text_17241798877234jhvoho4ci9')}
                        </Typography>
                      ),
                      content: (row, i) => (
                        <TextInput
                          variant="outlined"
                          placeholder={translate('text_645bb193927b375079d28ace')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            updateThreshold({
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
                  addRecurringThreshold()
                } else {
                  deleteThreshold({ index: 0, isRecurring: true })
                }
                setRecurring(!displayRecurring)
              }}
              label={translate('text_1724234174945ztq15pvmty3')}
              subLabel={translate('text_172423417494563qf45qet2d')}
            />
            {displayRecurring && (
              <TableContainer>
                <ChargeTable
                  name={'progressive-billing-recurring'}
                  columns={[
                    {
                      size: 224,
                      content: () => (
                        <Typography className="px-4" variant="captionHl" noWrap>
                          {translate('text_17241798877230y851fdxzqu')}
                        </Typography>
                      ),
                    },
                    {
                      size: 197,
                      content: (row, i) => (
                        <AmountInput
                          variant="outlined"
                          beforeChangeFormatter={['chargeDecimal', 'positiveNumber']}
                          currency={currency}
                          value={row.amountCents}
                          onChange={(value) =>
                            updateThreshold({
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
                        <TextInput
                          variant="outlined"
                          placeholder={translate('text_645bb193927b375079d28ace')}
                          value={row.thresholdDisplayName ?? ''}
                          onChange={(value) => {
                            updateThreshold({
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
                  data={[recurringUsageThreshold ?? {}]}
                />
              </TableContainer>
            )}
            <Alert type="info">{translate('text_1724252232460iqofvwnpgnx')}</Alert>
          </Stack>
        </Accordion>
      ) : (
        <Button
          variant="quaternary"
          startIcon="plus"
          disabled={displayProgressiveBillingAccordion}
          onClick={() => {
            addNonRecurringThreshold()
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
          <Icon
            className="flex items-center"
            name="validate-filled"
            color={hasErrorInGroup ? 'disabled' : 'success'}
          />
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

const TableContainer = styled.div`
  overflow: auto;
  padding-right: ${theme.spacing(4)};
  margin-left: -${theme.spacing(4)};
  margin-right: -${theme.spacing(4)};
  padding-left: ${theme.spacing(4)};

  /* Make sure focus ring is not crop at the bottom */
  padding-bottom: ${theme.spacing(1)};
  margin-bottom: -${theme.spacing(1)};
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
