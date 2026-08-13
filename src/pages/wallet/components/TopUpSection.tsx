import Box from '@mui/material/Box'
import { useStore } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { InvoicingSettingsSelector } from '~/components/invoicingSettings/InvoicingSettingsSelector'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import { ADD_RECURRING_RULE_BUTTON_DATA_TEST } from '~/components/wallets/utils/dataTestConstants'
import {
  VIEW_TYPE_INVOICING_CAPTION_KEYS,
  VIEW_TYPE_PAYMENT_CAPTION_KEYS,
  ViewTypeEnum,
} from '~/core/constants/billingObjectViewTypes'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { GetCustomerInfosForWalletFormQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useRecurringRuleDrawer } from '~/pages/wallet/components/RecurringRuleDrawer'
import { emptyWalletFormDefaultValues } from '~/pages/wallet/mappers/mapFromApiToForm'

export const RECURRING_RULE_SELECTOR_TEST_ID = 'recurring-rule-selector'
export const RECURRING_RULE_ERROR_TEST_ID = 'recurring-rule-error'

interface TopUpSectionExtraProps {
  formType: keyof typeof FORM_TYPE_ENUM
  customerData?: GetCustomerInfosForWalletFormQuery
  walletCreatedAt?: string | null
  isRecurringTopUpEnabled: boolean
  setIsRecurringTopUpEnabled: (value: boolean) => void
  /**
   * Opens the rule drawer as soon as the form is ready — bridge for the
   * wallet-details "Recurring rule" tab Edit until the dedicated rule
   * mutations exist (ING-529). Only pass it once the wallet data is loaded.
   */
  autoOpenRuleDrawer?: boolean
}

const topUpSectionDefaultProps: TopUpSectionExtraProps = {
  formType: FORM_TYPE_ENUM.creation,
  customerData: undefined,
  walletCreatedAt: undefined,
  isRecurringTopUpEnabled: false,
  setIsRecurringTopUpEnabled: () => {},
  autoOpenRuleDrawer: false,
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
    autoOpenRuleDrawer,
  }) {
    const { isPremium } = useCurrentUser()
    const { translate } = useInternationalization()
    const { open: openPremiumWarningDialog } = usePremiumWarningDialog()

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

    const { openDrawer } = useRecurringRuleDrawer({
      customerData,
      walletCreatedAt,
      walletValues,
      onSave: (rule) => {
        // Rebuild the WHOLE array rather than setting an index: a bracket-index
        // set on an undefined base would create a plain object ({0: ...})
        // instead of an array and break validation.
        // Only element 0 is editable here (the UI is single-rule), so the tail
        // must be carried over: a wallet can hold several rules through the API
        // and the backend deletes every rule missing from the payload.
        form.setFieldValue('recurringTransactionRules', (previousRules) => [
          rule,
          ...(previousRules ?? []).slice(1),
        ])
        setIsRecurringTopUpEnabled(true)
      },
    })

    const openRuleDrawer = () => openDrawer(recurringTransactionRules)

    // Auto-open on landing (once): entering the form via the details-tab Edit
    // means "edit the rule", so skip the scroll-and-click.
    const hasAutoOpenedRuleDrawer = useRef(false)

    useEffect(() => {
      if (!autoOpenRuleDrawer || hasAutoOpenedRuleDrawer.current || !isPremium) return

      hasAutoOpenedRuleDrawer.current = true
      openDrawer(recurringTransactionRules)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenRuleDrawer, isPremium])

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
                data-test={ADD_RECURRING_RULE_BUTTON_DATA_TEST}
                variant="inline"
                startIcon="plus"
                endIcon={isPremium ? undefined : 'sparkles'}
                onClick={() => {
                  if (isPremium) {
                    // Create flow: the rule only reaches the form when the
                    // drawer saves — cancelling leaves the CTA untouched.
                    openDrawer()
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
                {translate(VIEW_TYPE_INVOICING_CAPTION_KEYS[ViewTypeEnum.WalletTopUp])}
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
                {translate(VIEW_TYPE_PAYMENT_CAPTION_KEYS[ViewTypeEnum.WalletTopUp])}
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
