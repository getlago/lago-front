import { BillingEntityLabel } from '~/components/billingEntity/BillingEntityLabel'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { InvoiceCustomSectionDisplay } from '~/components/invoceCustomFooter/InvoiceCustomSectionDisplay'
import { hasInvoiceCustomSectionsContent } from '~/components/invoceCustomFooter/utils'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useResolvedPaymentMethodValue } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, WalletDetailsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

export const WALLET_INFORMATIONS_CONTAINER_TEST_ID = 'wallet-informations-container'

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

const WalletInformations = ({ wallet }: WalletInformationsProps) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ, organization: { defaultCurrency } = {} } =
    useOrganizationInfos()

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

  const showAppliesToSection =
    !!wallet?.appliesTo?.feeTypes?.length || !!wallet?.appliesTo?.billableMetrics?.length
  const showPaymentSection = paymentMethodValue !== '-' || showWalletInvoiceCustomSectionsRow

  return (
    <div data-test={WALLET_INFORMATIONS_CONTAINER_TEST_ID} className="flex flex-col gap-12">
      <section
        className={tw(
          sectionClassName,
          !showAppliesToSection && !showPaymentSection && 'shadow-b-none',
        )}
      >
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
            {
              label: translate('text_17436114971570doqrwuwhf0'),
              value: (
                <BillingEntityLabel
                  ownId={wallet?.billingEntityId}
                  customerEntity={wallet?.customer?.billingEntity}
                />
              ),
            },
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

      {showAppliesToSection && (
        <section className={tw(sectionClassName, !showPaymentSection && 'shadow-b-none')}>
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

      {showPaymentSection && (
        <section className={tw(sectionClassName, 'shadow-b-none')}>
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
    </div>
  )
}

export default WalletInformations
