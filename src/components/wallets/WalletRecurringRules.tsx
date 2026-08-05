import { Typography } from '~/components/designSystem/Typography'
import { InvoiceCustomSectionDisplay } from '~/components/invoceCustomFooter/InvoiceCustomSectionDisplay'
import { hasInvoiceCustomSectionsContent } from '~/components/invoceCustomFooter/utils'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useResolvedPaymentMethodValue } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  WalletDetailsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodList, usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

export const WALLET_RECURRING_RULES_EMPTY_TEST_ID = 'wallet-recurring-rules-empty'
export const WALLET_RECURRING_RULES_RULE_TEST_ID = (index: number) =>
  `wallet-recurring-rules-rule-${index}`
const WALLET_RECURRING_RULES_TOPUP_TYPE_TEST_ID = 'wallet-recurring-rules-topup-type'

const YES_TRANSLATION_KEY = 'text_1764160009979jzn4xunn1z8'
const NO_TRANSLATION_KEY = 'text_176416000997957yqelmt2m2'

type WalletRecurringRule = NonNullable<WalletDetailsFragment['recurringTransactionRules']>[number]
type CustomerIcsData = ReturnType<typeof useCustomerInvoiceCustomSections>['data']

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col">
    <Typography variant="bodyHl" color="grey700">
      {title}
    </Typography>

    <Typography variant="caption" color="grey600">
      {subtitle}
    </Typography>
  </div>
)

const RecurringRuleBlock = ({
  rule,
  wallet,
  paymentMethodsList,
  customerIcsData,
}: {
  rule: WalletRecurringRule
  wallet: WalletDetailsFragment
  paymentMethodsList?: PaymentMethodList
  customerIcsData: CustomerIcsData
}) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const paymentMethodValue = useResolvedPaymentMethodValue(
    {
      paymentMethodType: rule.paymentMethodType,
      paymentMethodId: rule.paymentMethod?.id,
    },
    paymentMethodsList,
  )

  const formatCredits = (credits?: string | null, { zeroAsEmpty = true } = {}) => {
    const creditsAmount = Number(credits)
    // A non-numeric amount converts to 0 rather than rendering "NaN"
    const convertedAmount = Number.isNaN(creditsAmount)
      ? 0
      : creditsAmount * Number(wallet.rateAmount)

    return credits && (!zeroAsEmpty || creditsAmount !== 0)
      ? `${translate(
          'text_62da6ec24a8e24e44f812896',
          {
            amount: creditsAmount,
          },
          creditsAmount,
        )} • ${intlFormatNumber(convertedAmount, {
          currencyDisplay: 'symbol',
          currency: wallet.currency,
        })}`
      : '-'
  }

  const yesNo = (value?: boolean | null) =>
    translate(value ? YES_TRANSLATION_KEY : NO_TRANSLATION_KEY)

  const isTargetMethod = rule.method === RecurringTransactionMethodEnum.Target

  const invoiceRequiresSuccessfulPaymentRow = {
    label: translate('text_66a8aed1c3e07b277ec3990d'),
    value: yesNo(rule.invoiceRequiresSuccessfulPayment),
  }

  // Mirror the form's conditional visibility (RecurringRuleDrawer): both
  // toggles only exist once a paid amount is set, and the ignore-limits one
  // additionally requires the wallet to define paid top-up limits.
  const hasPaidCredits = Number(rule.paidCredits) > 0
  const hasWalletTopUpLimits = !!wallet.paidTopUpMinAmountCents || !!wallet.paidTopUpMaxAmountCents

  const showInvoiceCustomSectionsRow = hasInvoiceCustomSectionsContent({
    skipInvoiceCustomSections: rule.skipInvoiceCustomSections,
    selectedInvoiceCustomSections: rule.selectedInvoiceCustomSections,
    customerIcsData,
  })

  const showPaymentSection = paymentMethodValue !== '-' || showInvoiceCustomSectionsRow

  return (
    <>
      <section className={tw('flex flex-col gap-6', showPaymentSection && 'pb-12 shadow-b')}>
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_6657c29c84ad4500ad764ed7'),
              value: isTargetMethod
                ? translate('text_6657c34670561c0127132da4')
                : translate('text_6657cdd8cea6bf010e1ce128'),
            },
            {
              label: translate('text_1773043324341gpkiojxh628'),
              value: rule.transactionName || '-',
            },
            ...(isTargetMethod
              ? [
                  {
                    label: translate('text_1780047483204bk0fhgkeisn'),
                    value: (
                      <span data-test={WALLET_RECURRING_RULES_TOPUP_TYPE_TEST_ID}>
                        {translate(
                          rule.grantsTargetTopUp
                            ? 'text_17800474832056s97uz7bjy7'
                            : 'text_178004748320594nw5fau04a',
                        )}
                      </span>
                    ),
                  },
                  {
                    label: translate('text_6657c34670561c0127132da5'),
                    // A configured target of 0 is a valid value — only null/empty is "-"
                    value: formatCredits(rule.targetOngoingBalance, { zeroAsEmpty: false }),
                  },
                  ...(rule.targetOngoingBalance ? [invoiceRequiresSuccessfulPaymentRow] : []),
                ]
              : [
                  {
                    label: translate('text_1773043324341q5g4muycilq'),
                    value: formatCredits(rule.paidCredits),
                  },
                  ...(hasWalletTopUpLimits && hasPaidCredits
                    ? [
                        {
                          label: translate('text_1758285686646ty4gyil56oi'),
                          value: yesNo(rule.ignorePaidTopUpLimits),
                        },
                      ]
                    : []),
                  ...(hasPaidCredits ? [invoiceRequiresSuccessfulPaymentRow] : []),
                  {
                    label: translate('text_1773043324341cnkdf7j5dmp'),
                    value: formatCredits(rule.grantedCredits),
                  },
                ]),
            ...(rule.trigger === RecurringTransactionTriggerEnum.Interval
              ? [
                  {
                    label: translate('text_6657c29c84ad4500ad764ee1'),
                    value: translate('text_1773043324341kgvvw9ykx6a'),
                  },
                  {
                    label: translate('text_1773043324341ht718cwl1ub'),
                    value: rule.interval
                      ? translate(getIntervalTranslationKey[rule.interval])
                      : '-',
                  },
                  {
                    label: translate('text_66599bfb69fba1010535c5c2'),
                    value: rule.startedAt ? intlFormatDateTimeOrgaTZ(rule.startedAt)?.date : '-',
                  },
                ]
              : [
                  {
                    label: translate('text_6657c29c84ad4500ad764ee1'),
                    value: translate('text_1773043324341dd9c0u4ilhg'),
                  },
                  {
                    label: translate('text_6560809c38fb9de88d8a5315'),
                    value: rule.thresholdCredits
                      ? translate(
                          'text_62da6ec24a8e24e44f812896',
                          {
                            amount: Number(rule.thresholdCredits),
                          },
                          Number(rule.thresholdCredits),
                        )
                      : '-',
                  },
                ]),
            {
              label: translate('text_1772536695408pz0actopowa'),
              value: rule.expirationAt ? intlFormatDateTimeOrgaTZ(rule.expirationAt)?.date : '-',
            },
            {
              label: translate('text_17822197712865r9iwe3lgel'),
              value: rule.purchaseOrderNumber || '-',
            },
          ]}
        />

        {!!rule.transactionMetadata?.length && (
          <div className="flex flex-col gap-4">
            <Typography variant="captionHl" color="grey600">
              {translate('text_63fcc3218d35b9377840f59b')}
            </Typography>

            <DetailsPage.InfoGrid
              grid={rule.transactionMetadata.map((metadata) => ({
                label: metadata.key,
                value: metadata.value,
              }))}
            />
          </div>
        )}
      </section>

      {showPaymentSection && (
        <RecurringRulePaymentSection
          rule={rule}
          wallet={wallet}
          paymentMethodValue={paymentMethodValue}
          showInvoiceCustomSectionsRow={showInvoiceCustomSectionsRow}
        />
      )}
    </>
  )
}

// Same section as the wallet-level one on the overview (WalletInformations),
// scoped to the rule's own payment method / invoice custom sections.
const RecurringRulePaymentSection = ({
  rule,
  wallet,
  paymentMethodValue,
  showInvoiceCustomSectionsRow,
}: {
  rule: WalletRecurringRule
  wallet: WalletDetailsFragment
  paymentMethodValue: React.ReactNode
  showInvoiceCustomSectionsRow: boolean
}) => {
  const { translate } = useInternationalization()

  return (
    <section className="flex flex-col gap-6">
      <SectionTitle
        title={translate('text_1772536695408rpehpvkgn9s')}
        subtitle={translate('text_1772536695408eev9wm37z9t')}
      />

      <DetailsPage.InfoGrid
        grid={[
          {
            label: translate('text_1773043324341qj7t72i7qnk'),
            value: paymentMethodValue,
          },
          { label: '', value: '' },
          ...(showInvoiceCustomSectionsRow
            ? [
                {
                  label: translate('text_1773043324342n1x2iltnxvw'),
                  value: (
                    <InvoiceCustomSectionDisplay
                      selectedSections={rule.selectedInvoiceCustomSections}
                      skipSections={rule.skipInvoiceCustomSections}
                      customerId={wallet.customer?.id}
                      viewType={ViewTypeEnum.WalletRecurringTopUp}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </section>
  )
}

type WalletRecurringRulesProps = {
  wallet?: WalletDetailsFragment | null
}

/**
 * Read view of the wallet's recurring top-up rules (dedicated detail tab).
 * Editing goes through the wallet edition form — the rules have no dedicated
 * mutation, they only travel nested in updateCustomerWallet.
 */
const WalletRecurringRules = ({ wallet }: WalletRecurringRulesProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: wallet?.customer?.externalId || '',
    withDeleted: false,
  })

  // Customer-level ICS data, used to decide whether to show the invoice custom
  // sections row even when the rule has no explicit selection (fallback).
  const { data: customerIcsData } = useCustomerInvoiceCustomSections(wallet?.customer?.id || '')

  if (!wallet) {
    return
  }

  const recurringRules = wallet.recurringTransactionRules || []

  return (
    <div className="flex flex-col gap-6">
      {!isPremium && (
        <PremiumFeature
          title={translate('text_1773043324341b2vsoaxinkl')}
          description={translate('text_17730433243413krwjwou222')}
          feature={translate('text_1773043324341c2yyjb2fjwu')}
        />
      )}

      {isPremium && !recurringRules.length && (
        <Typography
          data-test={WALLET_RECURRING_RULES_EMPTY_TEST_ID}
          variant="caption"
          color="grey600"
        >
          {translate('text_1773043324341vyv0cdxzlys')}
        </Typography>
      )}

      {isPremium &&
        recurringRules.map((rule, index) => (
          <div
            key={rule.lagoId}
            className="flex flex-col gap-4"
            data-test={WALLET_RECURRING_RULES_RULE_TEST_ID(index)}
          >
            {recurringRules.length > 1 && (
              <Typography variant="captionHl" color="grey600">
                {translate('text_1783584917380z3uuxa0ey02', { number: index + 1 })}
              </Typography>
            )}

            <RecurringRuleBlock
              rule={rule}
              wallet={wallet}
              paymentMethodsList={paymentMethodsList}
              customerIcsData={customerIcsData}
            />
          </div>
        ))}
    </div>
  )
}

export default WalletRecurringRules
