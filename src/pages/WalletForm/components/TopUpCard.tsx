import { Box, InputAdornment, Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { FC, RefObject } from 'react'
import styled from 'styled-components'

import { Accordion, Alert, Button, Icon, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBoxField } from '~/components/form'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  getWordingForWalletCreationAlert,
  getWordingForWalletEditionAlert,
} from '~/components/wallets/utils'
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
  grantedCredits: undefined,
  interval: undefined,
  lagoId: undefined,
  paidCredits: undefined,
  trigger: RecurringTransactionTriggerEnum.Threshold,
  thresholdCredits: undefined,
  method: RecurringTransactionMethodEnum.Fixed,
  targetOngoingBalance: undefined,
}

interface TopUpCardProps {
  formikProps: FormikProps<TWalletDataForm>
  formType: (typeof FORM_TYPE_ENUM)[keyof typeof FORM_TYPE_ENUM]
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

  const recurringTransactionRules = formikProps.values?.recurringTransactionRules?.[0]

  const canDisplayEditionAlert =
    (!!recurringTransactionRules?.paidCredits || !!recurringTransactionRules?.grantedCredits) &&
    ((recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Interval &&
      !!recurringTransactionRules?.interval) ||
      recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold)

  return (
    <Card>
      <Typography variant="subhead">{translate('TODO: Wallet top-up')}</Typography>

      <Box>
        <Typography variant="bodyHl" color="grey700">
          {translate('TODO: Define credits to purchase and to grant upon wallet creation')}
        </Typography>
        <Typography variant="caption">
          {translate(
            'TODO: Credits for purchases generate an invoice, while credits for grants do not generate invoices',
          )}
        </Typography>
      </Box>

      {formType === FORM_TYPE_ENUM.creation && (
        <>
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

      <Box>
        <Typography variant="bodyHl" color="grey700">
          {translate('TODO: Add recurring top-up')}
        </Typography>
        <Typography variant="caption">
          {translate(
            'TODO: Define an automatic top-up based on a set interval or when a predefined threshold is reached',
          )}
        </Typography>
      </Box>

      {!isRecurringTopUpEnabled ? (
        <Button
          variant="quaternary"
          startIcon="plus"
          endIcon={isPremium ? undefined : 'sparkles'}
          onClick={() => {
            if (isPremium) {
              formikProps.setFieldValue('recurringTransactionRules.0', DEFAULT_RULES)
              setIsRecurringTopUpEnabled(true)
            } else {
              premiumWarningDialogRef.current?.openDialog()
            }
          }}
        >
          {translate('TODO: Add a recurring top-up rule')}
        </Button>
      ) : (
        <Accordion
          initiallyOpen
          summary={
            <AccordionSummary
              label={translate('TODO: Recurring top-up rule')}
              isValid={false}
              onDelete={() => setIsRecurringTopUpEnabled(false)}
            />
          }
        >
          <Stack direction="column" spacing={6}>
            <ComboBoxField
              name="recurringTransactionRules.0.method"
              disableClearable
              formikProps={formikProps}
              label={translate('TODO: Top-up method')}
              data={[
                {
                  label: translate('TODO: Fixed top-up'),
                  value: RecurringTransactionMethodEnum.Fixed,
                },
                {
                  label: translate('TODO: Dynamic top-up'),
                  value: RecurringTransactionMethodEnum.Target,
                },
              ]}
            />

            {recurringTransactionRules?.method === RecurringTransactionMethodEnum.Fixed && (
              <>
                <AmountInputField
                  name="recurringTransactionRules.0.paidCredits"
                  currency={formikProps.values.currency}
                  beforeChangeFormatter={['positiveNumber']}
                  label={translate('TODO: Credits to purchase')}
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
                  label={translate('TODO: Free credits to offer')}
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
                label={translate('TODO: Target ongoing balance')}
                formikProps={formikProps}
                silentError={true}
                helperText={translate('text_62d18855b22699e5cf55f88b', {
                  paidCredits: intlFormatNumber(
                    isNaN(Number(recurringTransactionRules?.paidCredits))
                      ? 0
                      : Number(recurringTransactionRules?.paidCredits) *
                          Number(formikProps.values.rateAmount),
                    {
                      currencyDisplay: 'symbol',
                      currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                    },
                  ),
                })}
                {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
              />
            )}

            <InlineTopUpElements>
              <ComboBoxField
                disableClearable
                label={translate('TODO: Trigger')}
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
                formikProps={formikProps}
              />
              {recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Interval && (
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
                </>
              )}
              {recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold && (
                <AmountInputField
                  name="recurringTransactionRules.0.thresholdCredits"
                  currency={formikProps.values.currency}
                  label={translate('text_6560809c38fb9de88d8a5315')}
                  formikProps={formikProps}
                  silentError={true}
                  {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                />
              )}
            </InlineTopUpElements>

            <Alert type="info">
              {getWordingForWalletCreationAlert({
                translate,
                currency: formikProps.values?.currency,
                customerTimezone: customerData?.customer?.timezone,
                rulesValues: recurringTransactionRules,
                walletValues: formikProps.values,
              })}
            </Alert>
          </Stack>
        </Accordion>
      )}

      {formType === FORM_TYPE_ENUM.creation && !isRecurringTopUpEnabled && (
        <Alert type="info">
          {getWordingForWalletCreationAlert({
            translate,
            currency: formikProps.values?.currency,
            customerTimezone: customerData?.customer?.timezone,
            rulesValues: recurringTransactionRules,
            walletValues: formikProps.values,
          })}
        </Alert>
      )}
      {isRecurringTopUpEnabled && canDisplayEditionAlert && formType === FORM_TYPE_ENUM.edition && (
        <Alert type="info">
          {getWordingForWalletEditionAlert({
            translate,
            currency: formikProps.values?.currency,
            customerTimezone: customerData?.customer?.timezone,
            rulesValues: recurringTransactionRules,
          })}
        </Alert>
      )}
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
`
