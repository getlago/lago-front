import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import { useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { FC, useState } from 'react'

import { Accordion } from '~/components/designSystem/Accordion'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { ButtonSelector, ComboBox, Switch } from '~/components/form'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import { PaymentMethodsForm, ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import { getWordingForWalletCreationAlert } from '~/components/wallets/utils'
import {
  ADD_METADATA_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  RECURRING_TOPUP_TYPE_DATA_TEST,
  SHOW_RECURRING_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { dateErrorCodes, FORM_TYPE_ENUM, getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { intlFormatDateTime } from '~/core/timezone'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
} from '~/formValidation/metadataSchema'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { topUpAmountError, walletFormErrorCodes } from '~/pages/wallet/form'
import { emptyWalletFormDefaultValues } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm } from '~/pages/wallet/types'

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

type TWalletRecurringRule = NonNullable<TWalletDataForm['recurringTransactionRules']>[number]

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

interface TopUpSectionExtraProps {
  formType: keyof typeof FORM_TYPE_ENUM
  customerData?: GetCustomerInfosForWalletFormQuery
  isRecurringTopUpEnabled: boolean
  setIsRecurringTopUpEnabled: (value: boolean) => void
}

const topUpSectionDefaultProps: TopUpSectionExtraProps = {
  formType: FORM_TYPE_ENUM.creation,
  customerData: undefined,
  isRecurringTopUpEnabled: false,
  setIsRecurringTopUpEnabled: () => {},
}

export const TopUpSection = withForm({
  defaultValues: emptyWalletFormDefaultValues(),
  props: topUpSectionDefaultProps,
  render: function TopUpSectionRender({
    form,
    customerData,
    isRecurringTopUpEnabled,
    setIsRecurringTopUpEnabled,
  }) {
    const { isPremium } = useCurrentUser()
    const { translate } = useInternationalization()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
    const [accordionIsOpen, setAccordionIsOpen] = useState(false)

    const recurringTransactionRules = useStore(
      form.store,
      (state) => state.values.recurringTransactionRules?.[0],
    )
    // Whole-values subscription: feeds the live recap alert (parity with the
    // Formik full re-render behaviour).
    const walletValues = useStore(form.store, (state) => state.values)
    const currency = useStore(form.store, (state) => state.values.currency)
    const rateAmount = useStore(form.store, (state) => state.values.rateAmount)
    const paidTopUpMinAmountCents = useStore(
      form.store,
      (state) => state.values.paidTopUpMinAmountCents,
    )
    const paidTopUpMaxAmountCents = useStore(
      form.store,
      (state) => state.values.paidTopUpMaxAmountCents,
    )

    // Schema-level check (NOT limited to mounted fields): mirrors the Formik
    // `errors.recurringTransactionRules` read that drove the validity icon.
    const hasRecurringTransactionRulesErrors = useStore(form.store, (state) => {
      const fields = (state.errorMap as { onDynamic?: { fields?: Record<string, unknown> } })
        ?.onDynamic?.fields

      return (
        !!fields &&
        Object.entries(fields).some(
          ([key, value]) => key.startsWith('recurringTransactionRules') && !!value,
        )
      )
    })

    const recurringPaidCreditsError = topUpAmountError({
      rateAmount,
      paidCredits: recurringTransactionRules?.paidCredits || '',
      paidTopUpMinAmountCents: (paidTopUpMinAmountCents ?? undefined) as string | undefined,
      paidTopUpMaxAmountCents: (paidTopUpMaxAmountCents ?? undefined) as string | undefined,
      currency,
      skip: !!recurringTransactionRules?.ignorePaidTopUpLimits,
      translate,
    })

    const hasMinMax = !!paidTopUpMinAmountCents || !!paidTopUpMaxAmountCents

    // Structural adapter for PaymentMethodsInvoiceSettings: its children only
    // need live `values` + a `setFieldValue(path, value)` — form-core resolves
    // the dot-index paths (`recurringTransactionRules.0.*`) it produces to the
    // same segments as our bracket field names.
    const paymentMethodsFormAdapter: PaymentMethodsForm<
      ViewTypeEnum.WalletTopUp | ViewTypeEnum.WalletRecurringTopUp
    > = {
      values: walletValues,
      setFieldValue: (field, value) =>
        form.setFieldValue(field as Parameters<typeof form.setFieldValue>[0], value as never),
    }

    const canDisplayAccordionAlert =
      !!recurringTransactionRules?.method &&
      ((recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Interval &&
        !!recurringTransactionRules?.interval) ||
        (recurringTransactionRules?.trigger === RecurringTransactionTriggerEnum.Threshold &&
          !!recurringTransactionRules?.thresholdCredits))

    return (
      <>
        {(customerData?.customer?.externalId || customerData?.customer?.id) && (
          <section className="flex w-full flex-col gap-6 pb-12 shadow-b">
            <div className="flex flex-col gap-1">
              <Typography variant="subhead1">
                {translate('text_17634566456760qoj7hs7jrh')}
              </Typography>
            </div>
            <PaymentMethodsInvoiceSettings
              customer={customerData?.customer}
              form={paymentMethodsFormAdapter}
              viewType={ViewTypeEnum.WalletTopUp}
            />
          </section>
        )}

        <section className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Typography variant="subhead1">{translate('text_1741101674268ag60i0cc55m')}</Typography>
            <Typography variant="caption">{translate('text_6657be42151661006d2f3b95')}</Typography>
          </div>
          {!isRecurringTopUpEnabled ? (
            <Box>
              <Button
                variant="inline"
                startIcon="plus"
                endIcon={isPremium ? undefined : 'sparkles'}
                onClick={() => {
                  if (isPremium) {
                    form.setFieldValue('recurringTransactionRules[0]', DEFAULT_RULES)
                    setIsRecurringTopUpEnabled(true)
                    setAccordionIsOpen(true)
                  } else {
                    openPremiumWarningDialog()
                  }
                }}
              >
                {translate('text_6657be42151661006d2f3b96')}
              </Button>
            </Box>
          ) : (
            <Accordion
              noContentMargin
              initiallyOpen={accordionIsOpen}
              summary={
                <AccordionSummary
                  label={translate('text_6657c29c84ad4500ad764ed6')}
                  isValid={!hasRecurringTransactionRulesErrors}
                  onDelete={async () => {
                    form.setFieldValue('recurringTransactionRules', undefined)
                    setIsRecurringTopUpEnabled(false)
                  }}
                />
              }
            >
              <div className="flex flex-col gap-6 p-4 shadow-b">
                <ComboBox
                  name="recurringTransactionRules[0].method"
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
                  value={recurringTransactionRules?.method as string}
                  onChange={(value) => {
                    // Cascading resets: switching method wipes the dependent
                    // fields back to their defaults (parity with Formik).
                    form.setFieldValue(
                      'recurringTransactionRules[0].paidCredits',
                      DEFAULT_RULES.paidCredits,
                    )
                    form.setFieldValue(
                      'recurringTransactionRules[0].grantedCredits',
                      DEFAULT_RULES.grantedCredits,
                    )
                    form.setFieldValue(
                      'recurringTransactionRules[0].targetOngoingBalance',
                      DEFAULT_RULES.targetOngoingBalance,
                    )
                    form.setFieldValue(
                      'recurringTransactionRules[0].grantsTargetTopUp',
                      value === RecurringTransactionMethodEnum.Target ? false : null,
                    )

                    form.setFieldValue(
                      'recurringTransactionRules[0].method',
                      value as RecurringTransactionMethodEnum,
                    )
                  }}
                />

                <form.AppField name="recurringTransactionRules[0].transactionName">
                  {(field) => (
                    <field.TextInputField
                      label={translate('text_17580145853389xkffv9cs1d')}
                      placeholder={translate('text_17580145853390n3v83gao69')}
                      helperText={translate('text_1758014585339r3kd52x7r58')}
                    />
                  )}
                </form.AppField>

                {recurringTransactionRules?.method === RecurringTransactionMethodEnum.Fixed && (
                  <>
                    <form.AppField name="recurringTransactionRules[0].paidCredits">
                      {(field) => (
                        <field.AmountInputField
                          currency={currency}
                          beforeChangeFormatter={['positiveNumber']}
                          label={translate('text_62e79671d23ae6ff149de944')}
                          silentError={true}
                          errorOverride={recurringPaidCreditsError?.label}
                          helperText={translate('text_62d18855b22699e5cf55f88b', {
                            paidCredits: formatCreditsToCurrency(
                              rateAmount,
                              recurringTransactionRules?.paidCredits as string | undefined,
                              currency,
                            ),
                          })}
                          {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                        />
                      )}
                    </form.AppField>

                    {recurringTransactionRules?.paidCredits && (
                      <>
                        {hasMinMax && (
                          <Switch
                            name="recurringTransactionRules[0].ignorePaidTopUpLimits"
                            onChange={(value) => {
                              form.setFieldValue(
                                'recurringTransactionRules[0].ignorePaidTopUpLimits',
                                value,
                              )
                            }}
                            checked={recurringTransactionRules?.ignorePaidTopUpLimits || false}
                            label={translate('text_1758285686646ty4gyil56oi')}
                            subLabel={translate('text_1758285686647hxpjldry342')}
                            data-test={RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}
                          />
                        )}

                        <Switch
                          name="recurringTransactionRules[0].invoiceRequiresSuccessfulPayment"
                          onChange={(value) => {
                            form.setFieldValue(
                              'recurringTransactionRules[0].invoiceRequiresSuccessfulPayment',
                              value,
                            )
                          }}
                          checked={
                            recurringTransactionRules?.invoiceRequiresSuccessfulPayment ??
                            (DEFAULT_RULES.invoiceRequiresSuccessfulPayment as boolean)
                          }
                          label={translate('text_66a8aed1c3e07b277ec3990d')}
                          subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
                          data-test={RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}
                        />
                      </>
                    )}

                    <form.AppField name="recurringTransactionRules[0].grantedCredits">
                      {(field) => (
                        <field.AmountInputField
                          currency={currency}
                          beforeChangeFormatter={['positiveNumber']}
                          label={translate('text_62e79671d23ae6ff149de954')}
                          silentError={true}
                          helperText={translate('text_62d18855b22699e5cf55f893', {
                            grantedCredits: formatCreditsToCurrency(
                              rateAmount,
                              recurringTransactionRules?.grantedCredits as string | undefined,
                              currency,
                            ),
                          })}
                          {...inputAdornment(translate('text_62d18855b22699e5cf55f889'))}
                        />
                      )}
                    </form.AppField>
                  </>
                )}

                {recurringTransactionRules?.method === RecurringTransactionMethodEnum.Target && (
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
                      value={recurringTransactionRules?.grantsTargetTopUp ?? false}
                      onChange={(value) => {
                        form.setFieldValue(
                          'recurringTransactionRules[0].grantsTargetTopUp',
                          value as boolean,
                        )
                      }}
                    />

                    <form.AppField name="recurringTransactionRules[0].targetOngoingBalance">
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
                    {recurringTransactionRules?.targetOngoingBalance && (
                      <Switch
                        name="recurringTransactionRules[0].invoiceRequiresSuccessfulPayment"
                        onChange={(value) => {
                          form.setFieldValue(
                            'recurringTransactionRules[0].invoiceRequiresSuccessfulPayment',
                            value,
                          )
                        }}
                        checked={
                          recurringTransactionRules?.invoiceRequiresSuccessfulPayment ??
                          (DEFAULT_RULES.invoiceRequiresSuccessfulPayment as boolean)
                        }
                        label={translate('text_66a8aed1c3e07b277ec3990d')}
                        subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
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
                    name="recurringTransactionRules[0].trigger"
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
                    value={recurringTransactionRules?.trigger}
                    onChange={(value) => {
                      // Cascading resets: switching trigger wipes the other
                      // axis' field back to its default (parity with Formik).
                      if (value === RecurringTransactionTriggerEnum.Interval) {
                        form.setFieldValue(
                          'recurringTransactionRules[0].thresholdCredits',
                          DEFAULT_RULES.thresholdCredits,
                        )
                      }

                      if (value === RecurringTransactionTriggerEnum.Threshold) {
                        form.setFieldValue(
                          'recurringTransactionRules[0].interval',
                          DEFAULT_RULES.interval,
                        )
                      }

                      form.setFieldValue(
                        'recurringTransactionRules[0].trigger',
                        value as RecurringTransactionTriggerEnum,
                      )
                    }}
                  />
                  {recurringTransactionRules?.trigger ===
                    RecurringTransactionTriggerEnum.Interval && (
                    <>
                      <form.AppField name="recurringTransactionRules[0].interval">
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
                                  getIntervalTranslationKey[
                                    RecurringTransactionIntervalEnum.Weekly
                                  ],
                                ),
                                value: RecurringTransactionIntervalEnum.Weekly,
                              },
                              {
                                label: translate(
                                  getIntervalTranslationKey[
                                    RecurringTransactionIntervalEnum.Monthly
                                  ],
                                ),
                                value: RecurringTransactionIntervalEnum.Monthly,
                              },
                              {
                                label: translate(
                                  getIntervalTranslationKey[
                                    RecurringTransactionIntervalEnum.Quarterly
                                  ],
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
                                  getIntervalTranslationKey[
                                    RecurringTransactionIntervalEnum.Yearly
                                  ],
                                ),
                                value: RecurringTransactionIntervalEnum.Yearly,
                              },
                            ]}
                          />
                        )}
                      </form.AppField>
                      <div className="flex-1">
                        <form.AppField name="recurringTransactionRules[0].startedAt">
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
                  {recurringTransactionRules?.trigger ===
                    RecurringTransactionTriggerEnum.Threshold && (
                    <form.AppField name="recurringTransactionRules[0].thresholdCredits">
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

                {canDisplayAccordionAlert && (
                  <Alert type="info">
                    {getWordingForWalletCreationAlert({
                      translate,
                      currency: walletValues?.currency,
                      customerTimezone: customerData?.customer?.timezone,
                      recurringRulesValues: recurringTransactionRules,
                      walletValues,
                    })}
                  </Alert>
                )}

                {!!recurringTransactionRules?.expirationAt ||
                recurringTransactionRules?.expirationAt === '' ? (
                  <div className="flex items-center gap-4">
                    <form.AppField name="recurringTransactionRules[0].expirationAt">
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
                          form.setFieldValue('recurringTransactionRules[0].expirationAt', null)
                        }}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    className="self-start"
                    startIcon="plus"
                    variant="inline"
                    onClick={() =>
                      form.setFieldValue('recurringTransactionRules[0].expirationAt', '')
                    }
                    data-test={SHOW_RECURRING_EXPIRATION_AT_DATA_TEST}
                  >
                    {translate('text_6560809c38fb9de88d8a517e')}
                  </Button>
                )}
              </div>

              {(customerData?.customer?.externalId || customerData?.customer?.id) && (
                <div className="flex flex-col gap-6 p-4 shadow-b">
                  <PaymentMethodsInvoiceSettings
                    customer={customerData?.customer}
                    form={paymentMethodsFormAdapter}
                    formFieldBasePath="recurringTransactionRules.0"
                    viewType={ViewTypeEnum.WalletRecurringTopUp}
                  />
                </div>
              )}

              <div className="flex flex-col gap-6 p-4">
                <div>
                  <Typography variant="bodyHl" color="textSecondary">
                    {translate('text_63fcc3218d35b9377840f59b')}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_1741690423581n3e4cj019jg')}
                  </Typography>
                </div>

                {recurringTransactionRules?.transactionMetadata?.map((_metadata, index) => {
                  return (
                    <div
                      className="flex w-full flex-row items-center gap-3"
                      key={`metadata-item-${index}`}
                    >
                      <div className="basis-[200px]">
                        <form.AppField
                          name={`recurringTransactionRules[0].transactionMetadata[${index}].key`}
                        >
                          {(field) => {
                            const keyError = (
                              field.state.meta.errors as unknown as { message?: string }[]
                            ).find((error) =>
                              Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                            )?.message

                            return (
                              <Tooltip
                                placement="top-end"
                                title={
                                  (keyError === MetadataErrorsEnum.uniqueness &&
                                    translate('text_63fcc3218d35b9377840f5dd')) ||
                                  (keyError === MetadataErrorsEnum.maxLength &&
                                    translate('text_63fcc3218d35b9377840f5d9', { max: 20 }))
                                }
                                disableHoverListener={!keyError}
                              >
                                <field.TextInputField
                                  label={translate('text_63fcc3218d35b9377840f5a3')}
                                  silentError={!keyError}
                                  placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                                  displayErrorText={false}
                                />
                              </Tooltip>
                            )
                          }}
                        </form.AppField>
                      </div>
                      <div className="grow">
                        <form.AppField
                          name={`recurringTransactionRules[0].transactionMetadata[${index}].value`}
                        >
                          {(field) => {
                            const valueError = (
                              field.state.meta.errors as unknown as { message?: string }[]
                            ).find((error) =>
                              Object.keys(MetadataErrorsEnum).includes(error?.message ?? ''),
                            )?.message

                            return (
                              <Tooltip
                                placement="top-end"
                                title={
                                  valueError === MetadataErrorsEnum.maxLength
                                    ? translate('text_63fcc3218d35b9377840f5e5', {
                                        max: METADATA_VALUE_MAX_LENGTH_DEFAULT,
                                      })
                                    : undefined
                                }
                                disableHoverListener={!valueError}
                              >
                                <field.TextInputField
                                  label={translate('text_63fcc3218d35b9377840f5ab')}
                                  silentError={!valueError}
                                  placeholder={translate('text_63fcc3218d35b9377840f5af')}
                                  displayErrorText={false}
                                />
                              </Tooltip>
                            )
                          }}
                        </form.AppField>
                      </div>
                      <Tooltip
                        className="flex items-center"
                        placement="top-end"
                        title={translate('text_63fcc3218d35b9377840f5e1')}
                      >
                        <Button
                          className="mt-7"
                          variant="quaternary"
                          size="medium"
                          icon="trash"
                          onClick={() => {
                            form.setFieldValue('recurringTransactionRules[0].transactionMetadata', [
                              ...(recurringTransactionRules.transactionMetadata || []).filter(
                                (_m, j) => {
                                  return j !== index
                                },
                              ),
                            ])
                          }}
                        />
                      </Tooltip>
                    </div>
                  )
                })}

                <Button
                  className="self-start"
                  startIcon="plus"
                  variant="inline"
                  onClick={() => {
                    const metadatas = [
                      ...(recurringTransactionRules?.transactionMetadata || []),
                      { key: '', value: '' },
                    ]

                    form.setFieldValue(
                      'recurringTransactionRules[0].transactionMetadata',
                      metadatas,
                    )
                  }}
                  data-test={ADD_METADATA_DATA_TEST}
                >
                  {translate('text_63fcc3218d35b9377840f5bb')}
                </Button>
              </div>
            </Accordion>
          )}
        </section>
      </>
    )
  },
})
