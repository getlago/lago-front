import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { ButtonSelector, ComboBox, Switch } from '~/components/form'
import { InvoicingSettingsSelector } from '~/components/invoicingSettings/InvoicingSettingsSelector'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import { getWordingForWalletCreationAlert } from '~/components/wallets/utils'
import {
  DELETE_RECURRING_EXPIRATION_AT_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  RECURRING_RULE_INVOICING_SETTINGS_SELECTOR_DATA_TEST,
  RECURRING_RULE_PAYMENT_SETTINGS_SELECTOR_DATA_TEST,
  RECURRING_TOPUP_TYPE_DATA_TEST,
  SHOW_RECURRING_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { dateErrorCodes, getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { TransactionMetadataGroup } from '~/pages/wallet/components/TransactionMetadataGroup'
import { topUpAmountError, walletFormErrorCodes } from '~/pages/wallet/form'
import { recurringRuleValidationSchema } from '~/pages/wallet/formInitialization/validationSchema'
import { TWalletDataForm, TWalletRecurringRule } from '~/pages/wallet/types'

const RECURRING_RULE_FORM_ID = 'recurring-rule-drawer-form'

const RECURRING_RULE_DRAWER_SAVE_TEST_ID = 'recurring-rule-drawer-save'

export const DEFAULT_RULES: TWalletRecurringRule = {
  lagoId: undefined,
  method: RecurringTransactionMethodEnum.Fixed,
  trigger: RecurringTransactionTriggerEnum.Threshold,
  interval: RecurringTransactionIntervalEnum.Weekly,
  grantedCredits: '',
  paidCredits: '',
  thresholdCredits: '',
  targetOngoingBalance: null,
  grantsTargetTopUp: null,
  startedAt: DateTime.now().toISO(),
  invoiceRequiresSuccessfulPayment: false,
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

interface RecurringRuleDrawerContentExtraProps {
  customerData?: GetCustomerInfosForWalletFormQuery
  walletCreatedAt?: string | null
  walletValues: TWalletDataForm
}

const recurringRuleDrawerContentDefaultProps: RecurringRuleDrawerContentExtraProps = {
  customerData: undefined,
  walletCreatedAt: undefined,
  walletValues: {} as TWalletDataForm,
}

const RecurringRuleDrawerContent = withForm({
  defaultValues: DEFAULT_RULES,
  props: recurringRuleDrawerContentDefaultProps,
  render: function RecurringRuleDrawerContentRender({
    form,
    customerData,
    walletCreatedAt,
    walletValues,
  }) {
    const { translate } = useInternationalization()

    const rule = useStore(form.store, (state) => state.values)

    const { currency, rateAmount, paidTopUpMinAmountCents, paidTopUpMaxAmountCents } = walletValues

    const recurringPaidCreditsError = topUpAmountError({
      rateAmount,
      paidCredits: rule.paidCredits || '',
      paidTopUpMinAmountCents: (paidTopUpMinAmountCents ?? undefined) as string | undefined,
      paidTopUpMaxAmountCents: (paidTopUpMaxAmountCents ?? undefined) as string | undefined,
      currency,
      skip: !!rule.ignorePaidTopUpLimits,
      translate,
    })

    const hasMinMax = !!paidTopUpMinAmountCents || !!paidTopUpMaxAmountCents

    const canDisplayAlert =
      !!rule.method &&
      ((rule.trigger === RecurringTransactionTriggerEnum.Interval && !!rule.interval) ||
        (rule.trigger === RecurringTransactionTriggerEnum.Threshold && !!rule.thresholdCredits))

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_6657c29c84ad4500ad764ed6')}
          description={translate('text_6657be42151661006d2f3b95')}
        />

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle title={translate('text_1785163793184lh4wkomad6h')} />
            <ComboBox
              name="method"
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
              value={rule.method as string}
              onChange={(value) => {
                // Cascading resets: switching method wipes the dependent
                // fields back to their defaults (parity with Formik).
                form.setFieldValue('paidCredits', DEFAULT_RULES.paidCredits)
                form.setFieldValue('grantedCredits', DEFAULT_RULES.grantedCredits)
                form.setFieldValue('targetOngoingBalance', DEFAULT_RULES.targetOngoingBalance)
                form.setFieldValue(
                  'grantsTargetTopUp',
                  value === RecurringTransactionMethodEnum.Target ? false : null,
                )

                form.setFieldValue('method', value as RecurringTransactionMethodEnum)
              }}
            />

            <form.AppField name="transactionName">
              {(field) => (
                <field.TextInputField
                  label={translate('text_17580145853389xkffv9cs1d')}
                  placeholder={translate('text_17580145853390n3v83gao69')}
                  helperText={translate('text_1758014585339r3kd52x7r58')}
                />
              )}
            </form.AppField>

            {rule.method === RecurringTransactionMethodEnum.Fixed && (
              <>
                <form.AppField name="paidCredits">
                  {(field) => (
                    <field.AmountInputField
                      currency={currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62e79671d23ae6ff149de944')}
                      errorOverride={recurringPaidCreditsError?.label}
                      helperText={translate('text_62d18855b22699e5cf55f88b', {
                        paidCredits: formatCreditsToCurrency(
                          rateAmount,
                          rule.paidCredits as string | undefined,
                          currency,
                        ),
                      })}
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  )}
                </form.AppField>

                {rule.paidCredits && (
                  <>
                    {hasMinMax && (
                      <Switch
                        name="ignorePaidTopUpLimits"
                        onChange={(value) => {
                          form.setFieldValue('ignorePaidTopUpLimits', value)
                        }}
                        checked={rule.ignorePaidTopUpLimits || false}
                        label={translate('text_1758285686646ty4gyil56oi')}
                        subLabel={translate('text_1758285686647hxpjldry342')}
                        data-test={RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}
                      />
                    )}

                    <Switch
                      name="invoiceRequiresSuccessfulPayment"
                      onChange={(value) => {
                        form.setFieldValue('invoiceRequiresSuccessfulPayment', value)
                      }}
                      checked={
                        rule.invoiceRequiresSuccessfulPayment ??
                        (DEFAULT_RULES.invoiceRequiresSuccessfulPayment as boolean)
                      }
                      label={translate('text_66a8aed1c3e07b277ec3990d')}
                      subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
                      data-test={RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}
                    />
                  </>
                )}

                <form.AppField name="grantedCredits">
                  {(field) => (
                    <field.AmountInputField
                      currency={currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_62e79671d23ae6ff149de954')}
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: formatCreditsToCurrency(
                          rateAmount,
                          rule.grantedCredits as string | undefined,
                          currency,
                        ),
                      })}
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  )}
                </form.AppField>
              </>
            )}

            {rule.method === RecurringTransactionMethodEnum.Target && (
              <>
                <ButtonSelector
                  data-test={RECURRING_TOPUP_TYPE_DATA_TEST}
                  label={translate('text_1780047483204bk0fhgkeisn')}
                  options={[
                    {
                      value: false,
                      label: translate('text_1780047483205fq5350ul8l9'),
                    },
                    {
                      value: true,
                      label: translate('text_1780047483205pks944o79kd'),
                    },
                  ]}
                  value={rule.grantsTargetTopUp ?? false}
                  onChange={(value) => {
                    form.setFieldValue('grantsTargetTopUp', value as boolean)
                  }}
                />

                <form.AppField name="targetOngoingBalance">
                  {(field) => (
                    <field.AmountInputField
                      currency={currency}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_6657c34670561c0127132da5')}
                      errorOverride={
                        (field.state.meta.errors as unknown as { message?: string }[]).some(
                          (error) =>
                            error?.message ===
                            walletFormErrorCodes.targetOngoingBalanceShouldBeGreaterThanThreshold,
                        )
                          ? translate('text_66584178ee91f801012606a6')
                          : undefined
                      }
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  )}
                </form.AppField>
                {rule.targetOngoingBalance && (
                  <Switch
                    name="invoiceRequiresSuccessfulPayment"
                    onChange={(value) => {
                      form.setFieldValue('invoiceRequiresSuccessfulPayment', value)
                    }}
                    checked={
                      rule.invoiceRequiresSuccessfulPayment ??
                      (DEFAULT_RULES.invoiceRequiresSuccessfulPayment as boolean)
                    }
                    label={translate('text_66a8aed1c3e07b277ec3990d')}
                    subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
                    data-test={RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}
                  />
                )}
              </>
            )}

            <div className="flex w-full flex-row gap-3">
              <ComboBox
                containerClassName="flex-1"
                disableClearable
                sortValues
                placeholder={translate('text_6657c29c84ad4500ad764ee2')}
                label={translate('text_6657c29c84ad4500ad764ee1')}
                name="trigger"
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
                value={rule.trigger}
                onChange={(value) => {
                  // Cascading resets: switching trigger wipes the other
                  // axis' field back to its default (parity with Formik).
                  if (value === RecurringTransactionTriggerEnum.Interval) {
                    form.setFieldValue('thresholdCredits', DEFAULT_RULES.thresholdCredits)
                  }

                  if (value === RecurringTransactionTriggerEnum.Threshold) {
                    form.setFieldValue('interval', DEFAULT_RULES.interval)
                  }

                  form.setFieldValue('trigger', value as RecurringTransactionTriggerEnum)
                }}
              />
              {rule.trigger === RecurringTransactionTriggerEnum.Interval && (
                <>
                  <form.AppField name="interval">
                    {(field) => (
                      <field.ComboBoxField
                        containerClassName="flex-1"
                        disableClearable
                        sortValues={false}
                        label={translate('text_65201b8216455901fe273dc1')}
                        placeholder={translate('text_6560c252c4f33631aff1ab27')}
                        data={[
                          {
                            label: translate(
                              getIntervalTranslationKey[RecurringTransactionIntervalEnum.Weekly],
                            ),
                            value: RecurringTransactionIntervalEnum.Weekly,
                          },
                          {
                            label: translate(
                              getIntervalTranslationKey[RecurringTransactionIntervalEnum.Monthly],
                            ),
                            value: RecurringTransactionIntervalEnum.Monthly,
                          },
                          {
                            label: translate(
                              getIntervalTranslationKey[RecurringTransactionIntervalEnum.Quarterly],
                            ),
                            value: RecurringTransactionIntervalEnum.Quarterly,
                          },
                          {
                            label: translate(
                              getIntervalTranslationKey[
                                RecurringTransactionIntervalEnum.Semiannual
                              ],
                            ),
                            value: RecurringTransactionIntervalEnum.Semiannual,
                          },
                          {
                            label: translate(
                              getIntervalTranslationKey[RecurringTransactionIntervalEnum.Yearly],
                            ),
                            value: RecurringTransactionIntervalEnum.Yearly,
                          },
                        ]}
                      />
                    )}
                  </form.AppField>
                  <div className="flex-1">
                    <form.AppField name="startedAt">
                      {(field) => (
                        <field.DatePickerField
                          placement="top-end"
                          label={translate('text_66599bfb69fba1010535c5c2')}
                          placeholder={translate('text_62d18855b22699e5cf55f899')}
                        />
                      )}
                    </form.AppField>
                  </div>
                </>
              )}
              {rule.trigger === RecurringTransactionTriggerEnum.Threshold && (
                <form.AppField name="thresholdCredits">
                  {(field) => (
                    <field.AmountInputField
                      className="flex-[2_2_0%]"
                      currency={currency}
                      label={translate('text_6560809c38fb9de88d8a5315')}
                      errorOverride={
                        (field.state.meta.errors as unknown as { message?: string }[]).some(
                          (error) =>
                            error?.message ===
                            walletFormErrorCodes.thresholdShouldBeLessThanTargetOngoingBalance,
                        )
                          ? translate('text_66584178ee91f801012606ac')
                          : undefined
                      }
                      {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                    />
                  )}
                </form.AppField>
              )}
            </div>

            {canDisplayAlert && (
              <Alert type="info">
                {getWordingForWalletCreationAlert({
                  translate,
                  currency: walletValues?.currency,
                  customerTimezone: customerData?.customer?.timezone,
                  walletCreatedAt,
                  recurringRulesValues: rule,
                  // The wording helpers read the rule through
                  // walletValues.recurringTransactionRules[0] — feed them the
                  // LIVE drawer draft, not the last committed parent value.
                  walletValues: { ...walletValues, recurringTransactionRules: [rule] },
                })}
              </Alert>
            )}

            {!!rule.expirationAt || rule.expirationAt === '' ? (
              <div className="flex items-center gap-4">
                <form.AppField name="expirationAt">
                  {(field) => (
                    <field.DatePickerField
                      className="grow"
                      disablePast
                      placement="top-end"
                      label={translate('text_62d18855b22699e5cf55f897')}
                      placeholder={translate('text_62d18855b22699e5cf55f899')}
                      helperText={translate('text_1741689608703zttwsl2nnq2')}
                      errorOverride={
                        (field.state.meta.errors as unknown as { message?: string }[]).some(
                          (error) => error?.message === dateErrorCodes.shouldBeInFuture,
                        )
                          ? translate('text_630ccd87b251590eaa5f9831', {
                              date: intlFormatDateTime(DateTime.now().toISO()).date,
                            })
                          : false
                      }
                    />
                  )}
                </form.AppField>
                <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
                  <Button
                    icon="trash"
                    variant="quaternary"
                    onClick={() => {
                      form.setFieldValue('expirationAt', null)
                    }}
                    data-test={DELETE_RECURRING_EXPIRATION_AT_DATA_TEST}
                  />
                </Tooltip>
              </div>
            ) : (
              <Button
                className="self-start"
                startIcon="plus"
                variant="inline"
                onClick={() => form.setFieldValue('expirationAt', '')}
                data-test={SHOW_RECURRING_EXPIRATION_AT_DATA_TEST}
              >
                {translate('text_6560809c38fb9de88d8a517e')}
              </Button>
            )}
          </CenteredPage.PageSection>

          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_63fcc3218d35b9377840f59b')}
              description={translate('text_1741690423581n3e4cj019jg')}
            />
            <TransactionMetadataGroup form={form} fields={{ metadata: 'transactionMetadata' }} />
          </CenteredPage.PageSection>

          {customerData?.customer?.id && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_17423672025282dl7iozy1ru')}
                description={translate('text_17848881050570gm2uu5e7sz', {
                  object: translate(VIEW_TYPE_TRANSLATION_KEYS[ViewTypeEnum.WalletRecurringTopUp]),
                })}
              />
              <InvoicingSettingsSelector
                viewType={ViewTypeEnum.WalletRecurringTopUp}
                customerId={customerData.customer.id}
                value={rule.invoiceCustomSection}
                onChange={(value) => form.setFieldValue('invoiceCustomSection', value)}
                data-test={RECURRING_RULE_INVOICING_SETTINGS_SELECTOR_DATA_TEST}
              />
            </CenteredPage.PageSection>
          )}

          {customerData?.customer?.externalId && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_1784888105056o78z8t3kjrg')}
                description={translate('text_17848881050572bq1s5uguni', {
                  object: translate(VIEW_TYPE_TRANSLATION_KEYS[ViewTypeEnum.WalletRecurringTopUp]),
                })}
              />
              <PaymentSettingsSelector
                viewType={ViewTypeEnum.WalletRecurringTopUp}
                externalCustomerId={customerData.customer.externalId}
                value={rule.paymentMethod}
                onChange={(value) => form.setFieldValue('paymentMethod', value)}
                data-test={RECURRING_RULE_PAYMENT_SETTINGS_SELECTOR_DATA_TEST}
              />
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})

interface UseRecurringRuleDrawerProps {
  customerData?: GetCustomerInfosForWalletFormQuery
  walletCreatedAt?: string | null
  walletValues: TWalletDataForm
  onSave: (rule: TWalletRecurringRule) => void | Promise<void>
}

interface UseRecurringRuleDrawerReturn {
  /** No values = create flow (defaults); values = edit flow (seeded copy) */
  openDrawer: (values?: TWalletRecurringRule) => void
}

/**
 * Hosts the whole recurring top-up rule form. The rule only reaches the
 * wallet form on save (drawer-local draft) — cancelling never mutates
 * recurringTransactionRules, so the create CTA stays untouched on abort.
 */
export const useRecurringRuleDrawer = ({
  customerData,
  walletCreatedAt,
  walletValues,
  onSave,
}: UseRecurringRuleDrawerProps): UseRecurringRuleDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: DEFAULT_RULES,
    validationLogic: revalidateLogic(),
    validators: {
      // Wallet-level bounds are frozen while the drawer is open (modal)
      onDynamic: recurringRuleValidationSchema({
        rateAmount: walletValues.rateAmount,
        paidTopUpMinAmountCents: walletValues.paidTopUpMinAmountCents,
        paidTopUpMaxAmountCents: walletValues.paidTopUpMaxAmountCents,
        currency: walletValues.currency,
      }),
    },
    onSubmit: async ({ value }) => {
      await onSave(value)
      drawer.close()
    },
  })

  const openDrawer = (values?: TWalletRecurringRule): void => {
    // Spread over the defaults so a partially-shaped rule (edit mode)
    // still seeds every field — lagoId rides along untouched.
    form.reset({ ...DEFAULT_RULES, ...values }, { keepDefaultValues: true })

    drawer.open({
      title: translate('text_6657c29c84ad4500ad764ed6'),
      form: { id: RECURRING_RULE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: (container) => focusFirstInput(container),
      children: (
        <RecurringRuleDrawerContent
          form={form}
          customerData={customerData}
          walletCreatedAt={walletCreatedAt}
          walletValues={walletValues}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={RECURRING_RULE_DRAWER_SAVE_TEST_ID}>
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
