import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { getWordingForWalletCreationAlert } from '~/components/wallets/utils'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CreateRecurringTransactionRuleInput,
  CurrencyEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  UpdateRecurringTransactionRuleInput,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import type { TWalletDataForm } from '~/pages/wallet/types'

import type { WalletRecurringSlice } from './walletFormSchema'

const DEFAULTS: WalletRecurringSlice = {
  enabled: false,
  method: RecurringTransactionMethodEnum.Fixed,
  transactionName: '',
  paidCredits: '',
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  targetOngoingBalance: '',
  trigger: RecurringTransactionTriggerEnum.Threshold,
  interval: RecurringTransactionIntervalEnum.Monthly,
  thresholdCredits: '',
  startedAt: null,
  expirationAt: null,
}

const INTERVAL_OPTIONS = [
  RecurringTransactionIntervalEnum.Weekly,
  RecurringTransactionIntervalEnum.Monthly,
  RecurringTransactionIntervalEnum.Quarterly,
  RecurringTransactionIntervalEnum.Semiannual,
  RecurringTransactionIntervalEnum.Yearly,
]

const creditsAdornment = (translate: TranslateFunc) => ({
  InputProps: {
    endAdornment: (
      <Typography className="mr-4" variant="body" color="textSecondary">
        {translate('text_62d18855b22699e5cf55f889')}
      </Typography>
    ),
  },
})

// Adapts the recurring slice + wallet currency into the arg shape expected by
// `getWordingForWalletCreationAlert` (~/components/wallets/utils), ported as-is from
// the Formik `TopUpSection`. That helper only reads `recurringRulesValues`
// (trigger/method/interval/thresholdCredits/targetOngoingBalance) and
// `walletValues.recurringTransactionRules[0]` (paidCredits/grantedCredits/startedAt)
// for the sentences we render here — every other `TWalletDataForm` field it requires
// by type is unused on this path, so it's filled with harmless placeholders instead
// of threading the full wallet form state into this sub-drawer.
const buildRecurringAlert = (
  values: WalletRecurringSlice,
  currency: CurrencyEnum,
  translate: TranslateFunc,
): string => {
  const recurringRulesValues: CreateRecurringTransactionRuleInput &
    UpdateRecurringTransactionRuleInput = {
    method: values.method,
    trigger: values.trigger,
    interval:
      values.trigger === RecurringTransactionTriggerEnum.Interval ? values.interval : undefined,
    thresholdCredits: values.thresholdCredits,
    paidCredits: values.paidCredits,
    grantedCredits: values.grantedCredits,
    targetOngoingBalance: values.targetOngoingBalance,
  }

  const walletValues = {
    currency,
    paidCredits: '',
    grantedCredits: '',
    priority: 1,
    rateAmount: '1',
    recurringTransactionRules: [
      {
        trigger: values.trigger,
        paidCredits: values.paidCredits,
        grantedCredits: values.grantedCredits,
        startedAt: values.startedAt,
      },
    ],
  } as TWalletDataForm

  return getWordingForWalletCreationAlert({
    currency,
    recurringRulesValues,
    walletValues,
    translate,
  })
}

export const WalletRecurringTopUpFields = withForm({
  defaultValues: DEFAULTS,
  props: { currency: CurrencyEnum.Usd as CurrencyEnum, rateAmount: '1' },
  render: function Render({ form, currency, rateAmount }) {
    const { translate } = useInternationalization()
    const adornment = creditsAdornment(translate)

    return (
      <div className="flex flex-col gap-8">
        <CenteredPage.PageTitle
          title={translate('text_1783352692385mulfe6vb211')}
          description={translate('text_1783352692385xcnr96jj40l')}
        />

        <form.AppField
          name="method"
          listeners={{
            onChange: () => {
              form.setFieldValue('paidCredits', DEFAULTS.paidCredits)
              form.setFieldValue('grantedCredits', DEFAULTS.grantedCredits)
              form.setFieldValue('targetOngoingBalance', DEFAULTS.targetOngoingBalance)
            },
          }}
        >
          {(field) => (
            <field.ComboBoxField
              disableClearable
              placeholder={translate('text_6657c29c84ad4500ad764ed8')}
              label={translate('text_6657c29c84ad4500ad764ed7')}
              data={[
                {
                  value: RecurringTransactionMethodEnum.Fixed,
                  label: translate('text_6657cdd8cea6bf010e1ce128'),
                },
                {
                  value: RecurringTransactionMethodEnum.Target,
                  label: translate('text_6657c34670561c0127132da4'),
                },
              ]}
            />
          )}
        </form.AppField>

        <form.AppField name="transactionName">
          {(field) => (
            <field.TextInputField
              label={translate('text_17580145853389xkffv9cs1d')}
              placeholder={translate('text_17580145853390n3v83gao69')}
              helperText={translate('text_1758014585339r3kd52x7r58')}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => state.values.method}>
          {(method) =>
            method === RecurringTransactionMethodEnum.Fixed ? (
              <>
                <form.AppField name="paidCredits">
                  {(field) => (
                    <field.TextInputField
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      label={translate('text_62e79671d23ae6ff149de944')}
                      helperText={translate('text_62d18855b22699e5cf55f88b', {
                        paidCredits: intlFormatNumber(
                          Number(field.state.value || 0) * Number(rateAmount || 0),
                          { currency },
                        ),
                      })}
                      {...adornment}
                    />
                  )}
                </form.AppField>

                <form.AppField name="grantedCredits">
                  {(field) => (
                    <field.TextInputField
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      label={translate('text_62e79671d23ae6ff149de954')}
                      helperText={translate('text_62d18855b22699e5cf55f893', {
                        grantedCredits: intlFormatNumber(
                          Number(field.state.value || 0) * Number(rateAmount || 0),
                          { currency },
                        ),
                      })}
                      {...adornment}
                    />
                  )}
                </form.AppField>
              </>
            ) : (
              <form.AppField name="targetOngoingBalance">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter={['positiveNumber', 'decimal']}
                    label={translate('text_6657c34670561c0127132da5')}
                    {...adornment}
                  />
                )}
              </form.AppField>
            )
          }
        </form.Subscribe>

        <form.AppField name="invoiceRequiresSuccessfulPayment">
          {(field) => (
            <field.SwitchField
              label={translate('text_66a8aed1c3e07b277ec3990d')}
              subLabel={translate('text_66a8aed1c3e07b277ec3990f')}
            />
          )}
        </form.AppField>

        <div className="flex gap-3">
          <form.AppField
            name="trigger"
            listeners={{
              onChange: () => {
                form.setFieldValue('interval', DEFAULTS.interval)
                form.setFieldValue('thresholdCredits', DEFAULTS.thresholdCredits)
                form.setFieldValue('startedAt', DEFAULTS.startedAt)
              },
            }}
          >
            {(field) => (
              <field.ComboBoxField
                containerClassName="flex-1"
                disableClearable
                placeholder={translate('text_6657c29c84ad4500ad764ee2')}
                label={translate('text_6657c29c84ad4500ad764ee1')}
                data={[
                  {
                    value: RecurringTransactionTriggerEnum.Interval,
                    label: translate('text_65201b8216455901fe273dc1'),
                  },
                  {
                    value: RecurringTransactionTriggerEnum.Threshold,
                    label: translate('text_6560809c38fb9de88d8a5315'),
                  },
                ]}
              />
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.trigger}>
            {(trigger) =>
              trigger === RecurringTransactionTriggerEnum.Interval ? (
                <>
                  <form.AppField name="interval">
                    {(field) => (
                      <field.ComboBoxField
                        containerClassName="flex-1"
                        disableClearable
                        placeholder={translate('text_6560c252c4f33631aff1ab27')}
                        label={translate('text_65201b8216455901fe273dc1')}
                        data={INTERVAL_OPTIONS.map((interval) => ({
                          value: interval,
                          label: translate(getIntervalTranslationKey[interval]),
                        }))}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="startedAt">
                    {(field) => (
                      <field.DatePickerField
                        className="flex-1"
                        label={translate('text_66599bfb69fba1010535c5c2')}
                        placeholder={translate('text_62d18855b22699e5cf55f899')}
                      />
                    )}
                  </form.AppField>
                </>
              ) : (
                <form.AppField name="thresholdCredits">
                  {(field) => (
                    <field.TextInputField
                      className="flex-[2_2_0%]"
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      label={translate('text_6560809c38fb9de88d8a5315')}
                      {...adornment}
                    />
                  )}
                </form.AppField>
              )
            }
          </form.Subscribe>
        </div>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const canDisplayAlert =
              (values.trigger === RecurringTransactionTriggerEnum.Interval && !!values.interval) ||
              (values.trigger === RecurringTransactionTriggerEnum.Threshold &&
                !!values.thresholdCredits)

            if (!canDisplayAlert) return null

            return <Alert type="info">{buildRecurringAlert(values, currency, translate)}</Alert>
          }}
        </form.Subscribe>

        <form.AppField name="expirationAt">
          {(field) => {
            const showExpiration = field.state.value !== null

            if (!showExpiration) {
              return (
                <Button
                  className="self-start"
                  startIcon="plus"
                  variant="inline"
                  onClick={() => field.handleChange('')}
                >
                  {translate('text_6560809c38fb9de88d8a517e')}
                </Button>
              )
            }

            return (
              <div className="flex items-end gap-3 [&>*:first-child]:flex-1">
                <field.DatePickerField
                  disablePast
                  label={translate('text_62d18855b22699e5cf55f897')}
                  placeholder={translate('text_62d18855b22699e5cf55f899')}
                  helperText={translate('text_1741689608703zttwsl2nnq2')}
                />
                <Tooltip
                  className="mb-1 h-fit"
                  placement="top-end"
                  title={translate('text_63aa085d28b8510cd46443ff')}
                >
                  <Button
                    icon="trash"
                    variant="quaternary"
                    onClick={() => field.handleChange(null)}
                  />
                </Tooltip>
              </div>
            )
          }}
        </form.AppField>
      </div>
    )
  },
})
