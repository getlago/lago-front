import Box from '@mui/material/Box'
import { useStore } from '@tanstack/react-form'
import { useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { InvoicingSettingsSelector } from '~/components/invoicingSettings/InvoicingSettingsSelector'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import {
  RecurringRuleDrawer,
  RecurringRuleDrawerRef,
} from '~/pages/wallet/components/RecurringRuleDrawer'
import { emptyWalletFormDefaultValues } from '~/pages/wallet/mappers/mapFromApiToForm'

export const RECURRING_RULE_SELECTOR_TEST_ID = 'recurring-rule-selector'
export const RECURRING_RULE_ERROR_TEST_ID = 'recurring-rule-error'

interface TopUpSectionExtraProps {
  formType: keyof typeof FORM_TYPE_ENUM
  customerData?: GetCustomerInfosForWalletFormQuery
  walletCreatedAt?: string | null
  isRecurringTopUpEnabled: boolean
  setIsRecurringTopUpEnabled: (value: boolean) => void
}

const topUpSectionDefaultProps: TopUpSectionExtraProps = {
  formType: FORM_TYPE_ENUM.creation,
  customerData: undefined,
  walletCreatedAt: undefined,
  isRecurringTopUpEnabled: false,
  setIsRecurringTopUpEnabled: () => {},
}

export const TopUpSection = withForm({
  defaultValues: emptyWalletFormDefaultValues(),
  props: topUpSectionDefaultProps,
  render: function TopUpSectionRender({
    form,
    customerData,
    walletCreatedAt,
    isRecurringTopUpEnabled,
    setIsRecurringTopUpEnabled,
  }) {
    const { isPremium } = useCurrentUser()
    const { translate } = useInternationalization()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()
    const drawerRef = useRef<RecurringRuleDrawerRef>(null)

    const recurringTransactionRules = useStore(
      form.store,
      (state) => state.values.recurringTransactionRules?.[0],
    )
    // Whole-values subscription: the drawer needs the wallet-level bounds
    // (rate, min/max, currency) and the recap-alert context.
    const walletValues = useStore(form.store, (state) => state.values)

    // Rule fields live inside the drawer, so schema errors keyed under
    // recurringTransactionRules* would be invisible at wallet submit (e.g. a
    // committed rule invalidated by a later min/max bounds change). Surface
    // them under the card; wallet-level fields keep their own inline errors.
    // Validator-produced errors live DIRECTLY on errorMap.onDynamic, keyed by
    // field path (the `.fields` sub-shape only exists for manual setErrorMap).
    const hasRecurringTransactionRulesErrors = useStore(form.store, (state) => {
      const dynamicErrors =
        (state.errorMap as { onDynamic?: Record<string, unknown> })?.onDynamic ?? {}

      return Object.entries(dynamicErrors).some(
        ([key, value]) => key.startsWith('recurringTransactionRules') && !!value,
      )
    })

    const openRuleDrawer = () => drawerRef.current?.openDrawer(recurringTransactionRules)

    return (
      <>
        <section className="flex w-full flex-col gap-6 pb-12 shadow-b">
          <div className="flex flex-col gap-1">
            <Typography variant="subhead1">{translate('text_1741101674268ag60i0cc55m')}</Typography>
            <Typography variant="caption">{translate('text_6657be42151661006d2f3b95')}</Typography>
          </div>
          {!isRecurringTopUpEnabled ? (
            <Box>
              <Button
                data-test="add-recurring-rule-button"
                variant="inline"
                startIcon="plus"
                endIcon={isPremium ? undefined : 'sparkles'}
                onClick={() => {
                  if (isPremium) {
                    // Create flow: the rule only reaches the form when the
                    // drawer saves — cancelling leaves the CTA untouched.
                    drawerRef.current?.openDrawer()
                  } else {
                    openPremiumWarningDialog()
                  }
                }}
              >
                {translate('text_6657be42151661006d2f3b96')}
              </Button>
            </Box>
          ) : (
            <div className="flex flex-col gap-1">
              <Selector
                icon="robot"
                title={translate('text_6657c29c84ad4500ad764ed6')}
                endContent={
                  <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
                }
                hoverActions={
                  <SelectorActions
                    actions={[
                      {
                        icon: 'trash',
                        tooltipCopy: translate('text_63ea0f84f400488553caa786'),
                        onClick: (e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          form.setFieldValue('recurringTransactionRules', undefined)
                          setIsRecurringTopUpEnabled(false)
                        },
                      },
                      {
                        icon: 'pen',
                        tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
                        onClick: openRuleDrawer,
                      },
                    ]}
                  />
                }
                onClick={openRuleDrawer}
                data-test={RECURRING_RULE_SELECTOR_TEST_ID}
              />

              {hasRecurringTransactionRulesErrors && (
                <Typography
                  variant="caption"
                  color="danger600"
                  data-test={RECURRING_RULE_ERROR_TEST_ID}
                >
                  {translate('text_1785143466690l5iq4bovlq2')}
                </Typography>
              )}
            </div>
          )}

          <RecurringRuleDrawer
            ref={drawerRef}
            customerData={customerData}
            walletCreatedAt={walletCreatedAt}
            walletValues={walletValues}
            onSave={(rule) => {
              // Set the WHOLE array: a bracket-index set on an undefined base
              // would create a plain object ({0: ...}) instead of an array
              // and break validation.
              form.setFieldValue('recurringTransactionRules', [rule])
              setIsRecurringTopUpEnabled(true)
            }}
          />
        </section>

        {customerData?.customer?.id && (
          <section
            className={
              customerData?.customer?.externalId
                ? 'flex w-full flex-col gap-6 pb-12 shadow-b'
                : 'flex w-full flex-col gap-6'
            }
          >
            <div className="flex flex-col gap-1">
              <Typography variant="subhead1">
                {translate('text_17423672025282dl7iozy1ru')}
              </Typography>
              <Typography variant="caption">
                {translate('text_17848881050570gm2uu5e7sz', {
                  object: translate(VIEW_TYPE_TRANSLATION_KEYS[ViewTypeEnum.WalletTopUp]),
                })}
              </Typography>
            </div>
            <InvoicingSettingsSelector
              viewType={ViewTypeEnum.WalletTopUp}
              customerId={customerData.customer.id}
              value={walletValues.invoiceCustomSection}
              onChange={(value) => form.setFieldValue('invoiceCustomSection', value)}
            />
          </section>
        )}

        {customerData?.customer?.externalId && (
          <section className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
              <Typography variant="subhead1">
                {translate('text_1784888105056o78z8t3kjrg')}
              </Typography>
              <Typography variant="caption">
                {translate('text_17848881050572bq1s5uguni', {
                  object: translate(VIEW_TYPE_TRANSLATION_KEYS[ViewTypeEnum.WalletTopUp]),
                })}
              </Typography>
            </div>
            <PaymentSettingsSelector
              viewType={ViewTypeEnum.WalletTopUp}
              externalCustomerId={customerData.customer.externalId}
              value={walletValues.paymentMethod}
              onChange={(value) => form.setFieldValue('paymentMethod', value)}
            />
          </section>
        )}
      </>
    )
  },
})
