import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { FC, RefObject } from 'react'
import styled from 'styled-components'

import { Alert, Icon, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBoxField, Switch } from '~/components/form'
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
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { Card, theme } from '~/styles'

import { TWalletDataForm } from '../types'

const DEFAULT_RULES = {
  grantedCredits: undefined,
  interval: undefined,
  lagoId: undefined,
  paidCredits: undefined,
  trigger: RecurringTransactionTriggerEnum.Threshold,
  thresholdCredits: undefined,
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
      <Typography variant="subhead">{translate('text_6560809c38fb9de88d8a5198')}</Typography>

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
              paidCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.paidCredits))
                  ? 0
                  : Number(formikProps.values.paidCredits) * Number(formikProps.values.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                },
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f889')}
                </InputAdornment>
              ),
            }}
          />

          <AmountInputField
            name="grantedCredits"
            currency={formikProps.values.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62d18855b22699e5cf55f88d')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: intlFormatNumber(
                isNaN(Number(formikProps.values.grantedCredits))
                  ? 0
                  : Number(formikProps.values.grantedCredits) *
                      Number(formikProps.values.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                },
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f891')}
                </InputAdornment>
              ),
            }}
          />
        </>
      )}

      <InlineElements>
        <Switch
          name="isRecurringTopUpEnabled"
          checked={isRecurringTopUpEnabled}
          label={translate('text_6560809c38fb9de88d8a52ad')}
          subLabel={translate('text_6560809c38fb9de88d8a52c7')}
          onChange={(value) => {
            if (isPremium) {
              if (value) {
                formikProps.setFieldValue('recurringTransactionRules.0', DEFAULT_RULES)
              } else {
                formikProps.setFieldValue('recurringTransactionRules', [])
              }

              setIsRecurringTopUpEnabled(value)
            } else {
              premiumWarningDialogRef.current?.openDialog()
            }
          }}
        />
        {!isPremium && <Icon name="sparkles" />}
      </InlineElements>

      {formType === FORM_TYPE_ENUM.edition && isRecurringTopUpEnabled && (
        <>
          <AmountInputField
            name="recurringTransactionRules.0.paidCredits"
            currency={formikProps.values.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62d18855b22699e5cf55f885')}
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f889')}
                </InputAdornment>
              ),
            }}
          />

          <AmountInputField
            name="recurringTransactionRules.0.grantedCredits"
            currency={formikProps.values.currency}
            beforeChangeFormatter={['positiveNumber']}
            label={translate('text_62d18855b22699e5cf55f88d')}
            formikProps={formikProps}
            silentError={true}
            helperText={translate('text_62d18855b22699e5cf55f893', {
              grantedCredits: intlFormatNumber(
                isNaN(Number(recurringTransactionRules?.grantedCredits))
                  ? 0
                  : Number(recurringTransactionRules?.grantedCredits) *
                      Number(formikProps.values.rateAmount),
                {
                  currencyDisplay: 'symbol',
                  currency: formikProps?.values?.currency || CurrencyEnum.Usd,
                },
              ),
            })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62d18855b22699e5cf55f891')}
                </InputAdornment>
              ),
            }}
          />
        </>
      )}

      {isRecurringTopUpEnabled && (
        <InlineTopUpElements>
          <ComboBoxField
            disableClearable
            label={translate('text_6560809c38fb9de88d8a52fb')}
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
            <ComboBoxField
              disableClearable
              sortValues={false}
              label={translate('text_65201b8216455901fe273dc1')}
              placeholder={translate('text_6560c252c4f33631aff1ab27')}
              name="recurringTransactionRules.0.interval"
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
              formikProps={formikProps}
            />
          )}
          {recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold && (
            <AmountInputField
              name="recurringTransactionRules.0.thresholdCredits"
              currency={formikProps.values.currency}
              label={translate('text_6560809c38fb9de88d8a5315')}
              formikProps={formikProps}
              silentError={true}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {translate('text_62d18855b22699e5cf55f891')}
                  </InputAdornment>
                ),
              }}
            />
          )}
        </InlineTopUpElements>
      )}

      {formType === FORM_TYPE_ENUM.creation && (
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

const InlineElements = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const InlineTopUpElements = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: ${theme.spacing(3)};
`
