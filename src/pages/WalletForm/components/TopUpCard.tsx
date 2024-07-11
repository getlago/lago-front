import { Box, InputAdornment, Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { get } from 'lodash'
import { DateTime } from 'luxon'
import { FC, RefObject, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Alert, Button, Icon, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField, DatePickerField } from '~/components/form'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { getWordingForWalletCreationAlert } from '~/components/wallets/utils'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  UpdateRecurringTransactionRuleInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { walletFormErrorCodes } from '~/pages/WalletForm/form'
import { Card, theme } from '~/styles'

import { TWalletDataForm } from '../types'

const AccordionSummary: FC<{ label: string; isValid: boolean; onDelete: VoidFunction }> = ({
  label,
  isValid,
  onDelete,
}) => {
  return (
    <Stack
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={3}
    >
      <Box>
        <Typography color="grey700">{label}</Typography>
      </Box>
      <Stack marginTop="0 !important" direction="row" alignItems="center" spacing={3}>
        <Icon name="validate-filled" color={isValid ? 'success' : 'disabled'} />
        <Button icon="trash" variant="quaternary" size="small" onClick={onDelete} />
      </Stack>
    </Stack>
  )
}

const inputAdornment = (endLabel: string) => {
  return {
    InputProps: {
      endAdornment: <InputAdornment position="end">{endLabel}</InputAdornment>,
    },
  }
}

const formatCreditsToCurrency = (rate: string, credits?: string, currency?: CurrencyEnum) => {
  return intlFormatNumber(isNaN(Number(credits)) ? 0 : Number(credits) * Number(rate), {
    currencyDisplay: 'symbol',
    currency: currency || CurrencyEnum.Usd,
  })
}

const DEFAULT_RULES: UpdateRecurringTransactionRuleInput = {
  lagoId: undefined,
  method: RecurringTransactionMethodEnum.Fixed,
  trigger: RecurringTransactionTriggerEnum.Threshold,
  interval: RecurringTransactionIntervalEnum.Weekly,
  grantedCredits: '',
  paidCredits: '',
  thresholdCredits: '',
  targetOngoingBalance: null,
  startedAt: DateTime.now().toISO(),
}

interface TopUpCardProps {
  formikProps: FormikProps<TWalletDataForm>
  formType: keyof typeof FORM_TYPE_ENUM
  customerData?: GetCustomerInfosForWalletFormQuery
  isRecurringTopUpEnabled: boolean
  setIsRecurringTopUpEnabled: (value: boolean) => void
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export const TopUpCard: FC<TopUpCardProps> = ({
  formikProps,
  formType,
  customerData,
  isRecurringTopUpEnabled,
  setIsRecurringTopUpEnabled,
  premiumWarningDialogRef,
}) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const [accordionIsOpen, setAccordionIsOpen] = useState(false)

  const recurringTransactionRules = formikProps.values?.recurringTransactionRules?.[0]

  const canDisplayAccordionAlert =
    !!recurringTransactionRules?.method &&
    ((recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Interval &&
      !!recurringTransactionRules?.interval) ||
      (recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold &&
        !!recurringTransactionRules?.thresholdCredits))

  const hasRecurringTransactionRulesErrors = useMemo(() => {
    return formikProps?.errors?.recurringTransactionRules?.length
  }, [formikProps?.errors?.recurringTransactionRules])

  return (
    <Card $disableChildSpacing>
      <Stack gap={12} width="100%">
        <Stack gap={6} width="100%">
          <Typography variant="subhead1">{translate('text_6657be42151661006d2f3b89')}</Typography>

          {formType === FORM_TYPE_ENUM.creation && (
            <>
              <Box>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_6657be42151661006d2f3b8a')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_6657be42151661006d2f3b8b')}
                </Typography>
              </Box>

              <AmountInputField
                name="paidCredits"
                currency={formikProps.values.currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_62d18855b22699e5cf55f885')}
                formikProps={formikProps}
                silentError={true}
                helperText={translate('text_62d18855b22699e5cf55f88b', {
                  paidCredits: formatCreditsToCurrency(
                    formikProps.values.rateAmount,
                    formikProps.values.paidCredits,
                    formikProps.values.currency,
                  ),
                })}
                {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
              />

              <AmountInputField
                name="grantedCredits"
                currency={formikProps.values.currency}
                beforeChangeFormatter={['positiveNumber']}
                label={translate('text_62d18855b22699e5cf55f88d')}
                formikProps={formikProps}
                silentError={true}
                helperText={translate('text_62d18855b22699e5cf55f893', {
                  grantedCredits: formatCreditsToCurrency(
                    formikProps.values.rateAmount,
                    formikProps.values.grantedCredits,
                    formikProps.values.currency,
                  ),
                })}
                {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
              />
            </>
          )}
        </Stack>

        <Stack gap={6} width="100%">
          <Box>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_6657be42151661006d2f3b94')}
            </Typography>
            <Typography variant="caption">{translate('text_6657be42151661006d2f3b95')}</Typography>
          </Box>

          {!isRecurringTopUpEnabled ? (
            <Box>
              <Button
                variant="quaternary"
                startIcon="plus"
                endIcon={isPremium ? undefined : 'sparkles'}
                onClick={() => {
                  if (isPremium) {
                    formikProps.setFieldValue('recurringTransactionRules.0', DEFAULT_RULES)
                    setIsRecurringTopUpEnabled(true)
                    setAccordionIsOpen(true)
                  } else {
                    premiumWarningDialogRef.current?.openDialog()
                  }
                }}
              >
                {translate('text_6657be42151661006d2f3b96')}
              </Button>
            </Box>
          ) : (
            <Accordion
              initiallyOpen={accordionIsOpen}
              summary={
                <AccordionSummary
                  label={translate('text_6657c29c84ad4500ad764ed6')}
                  isValid={!hasRecurringTransactionRulesErrors}
                  onDelete={async () => {
                    formikProps.setFieldValue('recurringTransactionRules', undefined)
                    setIsRecurringTopUpEnabled(false)
                  }}
                />
              }
            >
              <Stack direction="column" spacing={6}>
                <ComboBox
                  name="recurringTransactionRules.0.method"
                  disableClearable
                  sortValues
                  placeholder={translate('text_6657c29c84ad4500ad764ed8')}
                  label={translate('text_6657c29c84ad4500ad764ed7')}
                  data={[
                    {
                      label: translate('text_6657cdd8cea6bf010e1ce128'),
                      value: RecurringTransactionMethodEnum.Fixed,
                    },
                    {
                      label: translate('text_6657c34670561c0127132da4'),
                      value: RecurringTransactionMethodEnum.Target,
                    },
                  ]}
                  value={formikProps.values.recurringTransactionRules?.[0].method as string}
                  onChange={(value) => {
                    formikProps.setFieldValue(
                      'recurringTransactionRules.0.paidCredits',
                      DEFAULT_RULES.paidCredits,
                    )
                    formikProps.setFieldValue(
                      'recurringTransactionRules.0.grantedCredits',
                      DEFAULT_RULES.grantedCredits,
                    )
                    formikProps.setFieldValue(
                      'recurringTransactionRules.0.targetOngoingBalance',
                      DEFAULT_RULES.targetOngoingBalance,
                    )

                    formikProps.setFieldValue('recurringTransactionRules.0.method', value)
                  }}
                />

                {recurringTransactionRules?.method === RecurringTransactionMethodEnum.Fixed && (
                  <>
                    <AmountInputField
                      name="recurringTransactionRules.0.paidCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62e79671d23ae6ff149de944')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f88b', {
                        paidCredits: formatCreditsToCurrency(
                          formikProps.values.rateAmount,
                          recurringTransactionRules?.paidCredits as string | undefined,
                          formikProps.values.currency,
                        ),
                      })}
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                    <AmountInputField
                      name="recurringTransactionRules.0.grantedCredits"
                      currency={formikProps.values.currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62e79671d23ae6ff149de954')}
                      formikProps={formikProps}
                      silentError={true}
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: formatCreditsToCurrency(
                          formikProps.values.rateAmount,
                          recurringTransactionRules?.grantedCredits as string | undefined,
                          formikProps.values.currency,
                        ),
                      })}
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  </>
                )}

                {recurringTransactionRules?.method === RecurringTransactionMethodEnum.Target && (
                  <AmountInputField
                    name="recurringTransactionRules.0.targetOngoingBalance"
                    currency={formikProps.values.currency}
                    beforeChangeFormatter={['positiveNumber']}
                    label={translate('text_6657c34670561c0127132da5')}
                    formikProps={formikProps}
                    error={
                      get(
                        formikProps.errors,
                        'recurringTransactionRules.0.targetOngoingBalance',
                      ) === walletFormErrorCodes.targetOngoingBalanceShouldBeGreaterThanThreshold
                        ? translate('text_66584178ee91f801012606a6')
                        : undefined
                    }
                    {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                  />
                )}

                <InlineTopUpElements>
                  <ComboBox
                    disableClearable
                    sortValues
                    placeholder={translate('text_6657c29c84ad4500ad764ee2')}
                    label={translate('text_6657c29c84ad4500ad764ee1')}
                    name="recurringTransactionRules.0.trigger"
                    data={[
                      {
                        label: translate('text_65201b8216455901fe273dc1'),
                        value: RecurringTransactionTriggerEnum.Interval,
                      },
                      {
                        label: translate('text_6560809c38fb9de88d8a5315'),
                        value: RecurringTransactionTriggerEnum.Threshold,
                      },
                    ]}
                    value={formikProps.values.recurringTransactionRules?.[0].trigger}
                    onChange={(value) => {
                      if (value === RecurringTransactionTriggerEnum.Interval) {
                        formikProps.setFieldValue(
                          'recurringTransactionRules.0.thresholdCredits',
                          DEFAULT_RULES.thresholdCredits,
                        )
                      }

                      if (value === RecurringTransactionTriggerEnum.Threshold) {
                        formikProps.setFieldValue(
                          'recurringTransactionRules.0.interval',
                          DEFAULT_RULES.interval,
                        )
                      }

                      formikProps.setFieldValue('recurringTransactionRules.0.trigger', value)
                    }}
                  />
                  {recurringTransactionRules?.trigger ===
                    RecurringTransactionTriggerEnum.Interval && (
                    <>
                      <ComboBoxField
                        name="recurringTransactionRules.0.interval"
                        disableClearable
                        sortValues={false}
                        formikProps={formikProps}
                        label={translate('text_65201b8216455901fe273dc1')}
                        placeholder={translate('text_6560c252c4f33631aff1ab27')}
                        data={[
                          {
                            label: translate('text_62b32ec6b0434070791c2d4c'),
                            value: RecurringTransactionIntervalEnum.Weekly,
                          },
                          {
                            label: translate('text_624453d52e945301380e49aa'),
                            value: RecurringTransactionIntervalEnum.Monthly,
                          },
                          {
                            label: translate('text_64d6357b00dea100ad1cb9e9'),
                            value: RecurringTransactionIntervalEnum.Quarterly,
                          },
                          {
                            label: translate('text_624453d52e945301380e49ac'),
                            value: RecurringTransactionIntervalEnum.Yearly,
                          },
                        ]}
                      />
                      <DatePickerField
                        name="recurringTransactionRules.0.startedAt"
                        placement="top-end"
                        formikProps={formikProps}
                        label={translate('text_66599bfb69fba1010535c5c2')}
                        placeholder={translate('text_62d18855b22699e5cf55f899')}
                      />
                    </>
                  )}
                  {recurringTransactionRules?.trigger ===
                    RecurringTransactionTriggerEnum.Threshold && (
                    <AmountInputField
                      className="span-2"
                      name="recurringTransactionRules.0.thresholdCredits"
                      currency={formikProps.values.currency}
                      label={translate('text_6560809c38fb9de88d8a5315')}
                      formikProps={formikProps}
                      error={
                        get(formikProps.errors, 'recurringTransactionRules.0.thresholdCredits') ===
                        walletFormErrorCodes.thresholdShouldBeLessThanTargetOngoingBalance
                          ? translate('text_66584178ee91f801012606ac')
                          : undefined
                      }
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  )}
                </InlineTopUpElements>

                {canDisplayAccordionAlert && (
                  <Alert type="info">
                    {getWordingForWalletCreationAlert({
                      translate,
                      currency: formikProps.values?.currency,
                      customerTimezone: customerData?.customer?.timezone,
                      recurringRulesValues: recurringTransactionRules,
                      walletValues: formikProps.values,
                    })}
                  </Alert>
                )}
              </Stack>
            </Accordion>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

const InlineTopUpElements = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: ${theme.spacing(3)};

  > div {
    flex: 1;
  }

  > div.span-2 {
    flex: 2;
  }
`
