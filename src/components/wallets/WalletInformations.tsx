import { BillingEntityLabel } from '~/components/billingEntity/BillingEntityLabel'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { InvoiceCustomSectionDisplay } from '~/components/invoceCustomFooter/InvoiceCustomSectionDisplay'
import { hasInvoiceCustomSectionsContent } from '~/components/invoceCustomFooter/utils'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useResolvedPaymentMethodValue } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import { ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  FeatureFlagEnum,
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

export const WALLET_INFORMATIONS_CONTAINER_TEST_ID = 'wallet-informations-container'
export const WALLET_INFORMATIONS_NO_RECURRING_TEST_ID = 'wallet-informations-no-recurring'
export const WALLET_INFORMATIONS_RECURRING_RULE_TEST_ID = (index: number) =>
  `wallet-informations-recurring-rule-${index}`
const WALLET_INFORMATIONS_TOPUP_TYPE_TEST_ID = 'wallet-informations-topup-type'

const YES_TRANSLATION_KEY = 'text_1764160009979jzn4xunn1z8'
const NO_TRANSLATION_KEY = 'text_176416000997957yqelmt2m2'

type WalletRecurringRule = NonNullable<WalletDetailsFragment['recurringTransactionRules']>[number]
type CustomerIcsData = ReturnType<typeof useCustomerInvoiceCustomSections>['data']

type WalletInformationsProps = {
  wallet?: WalletDetailsFragment | null
}

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

const RecurringRuleInfoGrid = ({
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

  const formatCredits = (credits?: string | null, { zeroAsEmpty = true } = {}) =>
    credits && (!zeroAsEmpty || Number(credits) !== 0)
      ? `${translate(
          'text_62da6ec24a8e24e44f812896',
          {
            amount: Number(credits),
          },
          Number(credits),
        )} • ${intlFormatNumber(
          isNaN(Number(credits)) ? 0 : Number(credits) * Number(wallet.rateAmount),
          {
            currencyDisplay: 'symbol',
            currency: wallet.currency,
          },
        )}`
      : '-'

  const yesNo = (value?: boolean | null) =>
    translate(value ? YES_TRANSLATION_KEY : NO_TRANSLATION_KEY)

  const isTargetMethod = rule.method === RecurringTransactionMethodEnum.Target

  const invoiceRequiresSuccessfulPaymentRow = {
    label: translate('text_66a8aed1c3e07b277ec3990d'),
    value: yesNo(rule.invoiceRequiresSuccessfulPayment),
  }

  // Mirror the form's conditional visibility (TopUpSection): both toggles only
  // exist once a paid amount is set, and the ignore-limits one additionally
  // requires the wallet to define paid top-up limits.
  const hasPaidCredits = Number(rule.paidCredits) > 0
  const hasWalletTopUpLimits = !!wallet.paidTopUpMinAmountCents || !!wallet.paidTopUpMaxAmountCents

  const showInvoiceCustomSectionsRow = hasInvoiceCustomSectionsContent({
    skipInvoiceCustomSections: rule.skipInvoiceCustomSections,
    selectedInvoiceCustomSections: rule.selectedInvoiceCustomSections,
    customerIcsData,
  })

  return (
    <>
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
                    <span data-test={WALLET_INFORMATIONS_TOPUP_TYPE_TEST_ID}>
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
                  value: rule.interval ? translate(getIntervalTranslationKey[rule.interval]) : '-',
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
            label: translate('text_1773043324341qj7t72i7qnk'),
            value: paymentMethodValue,
          },
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
    </>
  )
}

const WalletInformations = ({ wallet }: WalletInformationsProps) => {
  const { translate } = useInternationalization()
  const {
    intlFormatDateTimeOrgaTZ,
    hasFeatureFlag,
    organization: { defaultCurrency } = {},
  } = useOrganizationInfos()
  const { isPremium } = useCurrentUser()

  const showBillingEntityRow = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: wallet?.customer?.externalId || '',
    withDeleted: false,
  })

  const paymentMethodValue = useResolvedPaymentMethodValue(
    {
      paymentMethodType: wallet?.paymentMethodType,
      paymentMethodId: wallet?.paymentMethod?.id,
    },
    paymentMethodsList,
  )

  // Customer-level ICS data, used to decide whether to show the invoice custom
  // sections row even when the wallet has no explicit selection (fallback).
  const { data: customerIcsData } = useCustomerInvoiceCustomSections(wallet?.customer?.id || '')

  const formatAmount = (cents?: string | null) =>
    cents
      ? intlFormatNumber(Number(deserializeAmount(cents, currency) || 0), {
          currency,
          minimumFractionDigits: getCurrencyPrecision(currency),
          currencyDisplay: 'symbol',
        })
      : null

  if (!wallet) {
    return
  }

  const recurringRules = wallet?.recurringTransactionRules || []

  const currency = wallet?.currency || defaultCurrency || CurrencyEnum.Usd

  const paidTopUpMinAmountCents = formatAmount(wallet?.paidTopUpMinAmountCents)

  const paidTopUpMaxAmountCents = formatAmount(wallet?.paidTopUpMaxAmountCents)

  const sectionClassName = 'flex flex-col gap-6 pb-12 shadow-b'
  const chipContainerClassName = 'flex gap-3 mt-1'

  const showWalletInvoiceCustomSectionsRow = hasInvoiceCustomSectionsContent({
    skipInvoiceCustomSections: wallet?.skipInvoiceCustomSections,
    selectedInvoiceCustomSections: wallet?.selectedInvoiceCustomSections,
    customerIcsData,
  })

  return (
    <div data-test={WALLET_INFORMATIONS_CONTAINER_TEST_ID} className="flex flex-col gap-12">
      <section className={sectionClassName}>
        <SectionTitle
          title={translate('text_1772536695408sm7gfyxpi58')}
          subtitle={translate('text_1783584917380ry4fb4b5tpv')}
        />

        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_1772536695408sddzumtfq2t'), value: wallet?.name || '-' },
            {
              label: translate('text_1772536695408yflknt6y6q4'),
              value: wallet?.code ? (
                <TypographyWithCopy variant="body" color="grey700">
                  {wallet.code}
                </TypographyWithCopy>
              ) : (
                '-'
              ),
            },
            {
              label: translate('text_1750411499858su5b7bbp5t9'),
              value: translate('text_62da6ec24a8e24e44f812872', {
                rateAmount: intlFormatNumber(wallet.rateAmount, {
                  currency,
                  minimumFractionDigits: getCurrencyPrecision(currency),
                  currencyDisplay: 'symbol',
                }),
              }),
            },
            {
              label: translate('text_1755697949545w7vb1hox4n5'),
              value: wallet?.priority || '-',
            },
            {
              label: translate('text_1772536695408pz0actopowa'),
              value: wallet?.expirationAt
                ? intlFormatDateTimeOrgaTZ(wallet?.expirationAt)?.date
                : '-',
            },
            showBillingEntityRow
              ? {
                  label: translate('text_17436114971570doqrwuwhf0'),
                  value: (
                    <BillingEntityLabel
                      ownId={wallet?.billingEntityId}
                      customerEntity={wallet?.customer?.billingEntity}
                    />
                  ),
                }
              : { label: '', value: '' },
            {
              label: translate('text_1758286730208kztcznofxvr'),
              value: paidTopUpMinAmountCents || '-',
            },
            {
              label: translate('text_1758286730208ey87jz8nzuz'),
              value: paidTopUpMaxAmountCents || '-',
            },
            {
              label: translate('text_17822197712865r9iwe3lgel'),
              value: wallet?.purchaseOrderNumber || '-',
            },
          ]}
        />
      </section>

      {(!!wallet?.appliesTo?.feeTypes?.length || !!wallet?.appliesTo?.billableMetrics?.length) && (
        <section className={sectionClassName}>
          <SectionTitle
            title={translate('text_1772536695408hukog0udwpx')}
            subtitle={translate('text_17835849173808iwx5j9uoz4')}
          />

          <DetailsPage.InfoGrid
            grid={[
              ...(!!wallet?.appliesTo?.feeTypes?.length
                ? [
                    {
                      label: translate('text_17730433243428xpil56gqtb'),
                      value: (
                        <div className={chipContainerClassName}>
                          {wallet.appliesTo.feeTypes.map((feeType) => (
                            <Chip key={`wallet-applies-to-fee-type-${feeType}`} label={feeType} />
                          ))}
                        </div>
                      ),
                    },
                    { label: '', value: '' },
                  ]
                : []),
              ...(!!wallet?.appliesTo?.billableMetrics?.length
                ? [
                    {
                      label: translate('text_17730433243428xpil56gqtb'),
                      value: (
                        <div className={chipContainerClassName}>
                          {wallet.appliesTo.billableMetrics.map((bm) => (
                            <Chip
                              key={`wallet-applies-to-billable-metric-${bm.name}`}
                              label={bm.name}
                            />
                          ))}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </section>
      )}

      {(paymentMethodValue !== '-' || showWalletInvoiceCustomSectionsRow) && (
        <section className={sectionClassName}>
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
              ...(showWalletInvoiceCustomSectionsRow
                ? [
                    {
                      label: translate('text_1773043324342n1x2iltnxvw'),
                      value: (
                        <InvoiceCustomSectionDisplay
                          selectedSections={wallet?.selectedInvoiceCustomSections}
                          skipSections={wallet?.skipInvoiceCustomSections}
                          customerId={wallet?.customer?.id}
                          viewType={ViewTypeEnum.WalletTopUp}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </section>
      )}

      <section className={tw(sectionClassName, 'shadow-b-none')}>
        <SectionTitle
          title={translate('text_1772536695409spdoskvq4w5')}
          subtitle={translate('text_1783584917380so6uufk82e0')}
        />

        {!isPremium && (
          <PremiumFeature
            title={translate('text_1773043324341b2vsoaxinkl')}
            description={translate('text_17730433243413krwjwou222')}
            feature={translate('text_1773043324341c2yyjb2fjwu')}
          />
        )}

        {isPremium && !recurringRules.length && (
          <Typography
            data-test={WALLET_INFORMATIONS_NO_RECURRING_TEST_ID}
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
              data-test={WALLET_INFORMATIONS_RECURRING_RULE_TEST_ID(index)}
            >
              {recurringRules.length > 1 && (
                <Typography variant="captionHl" color="grey600">
                  {translate('text_1783584917380z3uuxa0ey02', { number: index + 1 })}
                </Typography>
              )}

              <RecurringRuleInfoGrid
                rule={rule}
                wallet={wallet}
                paymentMethodsList={paymentMethodsList}
                customerIcsData={customerIcsData}
              />
            </div>
          ))}
      </section>
    </div>
  )
}

export default WalletInformations
