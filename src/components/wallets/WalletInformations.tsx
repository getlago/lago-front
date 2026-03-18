import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
  WalletDetailsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { tw } from '~/styles/utils'

export const WALLET_INFORMATIONS_CONTAINER_TEST_ID = 'wallet-informations-container'
export const WALLET_INFORMATIONS_NO_RECURRING_TEST_ID = 'wallet-informations-no-recurring'

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
  const { isPremium } = useCurrentUser()

  const formatAmount = (cents?: string | null) =>
    cents
      ? intlFormatNumber(Number(deserializeAmount(cents, currency) || 0), {
          currency,
          minimumFractionDigits: getCurrencyPrecision(currency),
          currencyDisplay: 'symbol',
        })
      : null

  const formatCredits = (credits?: string) =>
    credits && Number(credits) !== 0
      ? `${translate(
          'text_62da6ec24a8e24e44f812896',
          {
            amount: Number(credits),
          },
          Number(credits || 0),
        )} • ${intlFormatNumber(
          isNaN(Number(credits)) ? 0 : Number(credits) * Number(wallet?.rateAmount),

          {
            currencyDisplay: 'symbol',
            currency: wallet?.currency,
          },
        )}`
      : '-'

  if (!wallet) {
    return
  }

  const recurring = wallet?.recurringTransactionRules?.[0]

  const currency = wallet?.currency || defaultCurrency || CurrencyEnum.Usd

  const paidTopUpMinAmountCents = formatAmount(wallet?.paidTopUpMinAmountCents)

  const paidTopUpMaxAmountCents = formatAmount(wallet?.paidTopUpMaxAmountCents)

  const sectionClassName = 'flex flex-col gap-6 pb-12 shadow-b'
  const chipContainerClassName = 'flex gap-3 mt-1'

  return (
    <div data-test={WALLET_INFORMATIONS_CONTAINER_TEST_ID} className="flex flex-col gap-12">
      <section className={sectionClassName}>
        <SectionTitle
          title={translate('text_1772536695408sm7gfyxpi58')}
          subtitle={translate('text_1772536695408zb493jkuibc')}
        />

        <DetailsPage.InfoGrid
          grid={[
            { label: translate('text_1772536695408sddzumtfq2t'), value: wallet?.name },
            { label: translate('text_1772536695408yflknt6y6q4'), value: wallet?.code },
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
            { label: '', value: '' },
            {
              label: translate('text_1758286730208kztcznofxvr'),
              value: paidTopUpMinAmountCents || translate('text_1772536695408bfc3c38pg36'),
              valueClassName: !paidTopUpMinAmountCents ? 'text-grey-600' : '',
            },
            {
              label: translate('text_1758286730208ey87jz8nzuz'),
              value: paidTopUpMaxAmountCents || translate('text_1772536695408bfc3c38pg36'),
              valueClassName: !paidTopUpMaxAmountCents ? 'text-grey-600' : '',
            },
          ]}
        />
      </section>

      {(!!wallet?.appliesTo?.feeTypes?.length || !!wallet?.appliesTo?.billableMetrics?.length) && (
        <section className={sectionClassName}>
          <SectionTitle
            title={translate('text_1772536695408hukog0udwpx')}
            subtitle={translate('text_1772536695408txbgkg82nhy')}
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

      {(wallet?.paymentMethod?.details || !!wallet?.selectedInvoiceCustomSections?.length) && (
        <section className={sectionClassName}>
          <SectionTitle
            title={translate('text_1772536695408rpehpvkgn9s')}
            subtitle={translate('text_1772536695408eev9wm37z9t')}
          />

          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_1773043324341qj7t72i7qnk'),
                value: formatPaymentMethodDetails(wallet?.paymentMethod?.details) || '-',
              },
              { label: '', value: '' },
              ...(!!wallet?.selectedInvoiceCustomSections?.length
                ? [
                    {
                      label: translate('text_1773043324342n1x2iltnxvw'),
                      value: (
                        <div className={chipContainerClassName}>
                          {wallet?.selectedInvoiceCustomSections?.map((section) => (
                            <Chip
                              key={`wallet-invoice-section-${section.id}`}
                              label={section.name}
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

      <section className={tw(sectionClassName, 'shadow-b-none')}>
        <SectionTitle
          title={translate('text_1772536695409spdoskvq4w5')}
          subtitle={translate('text_1773043324341of5enpi3z28')}
        />

        {!isPremium && (
          <PremiumFeature
            title={translate('text_1773043324341b2vsoaxinkl')}
            description={translate('text_17730433243413krwjwou222')}
            feature={translate('text_1773043324341c2yyjb2fjwu')}
          />
        )}

        {isPremium && !recurring && (
          <Typography
            data-test={WALLET_INFORMATIONS_NO_RECURRING_TEST_ID}
            variant="caption"
            color="grey600"
          >
            {translate('text_1773043324341vyv0cdxzlys')}
          </Typography>
        )}

        {isPremium && recurring && (
          <DetailsPage.InfoGrid
            grid={[
              {
                label: translate('text_6657c29c84ad4500ad764ed7'),
                value:
                  recurring?.method === RecurringTransactionMethodEnum.Fixed
                    ? translate('text_6657cdd8cea6bf010e1ce128')
                    : translate('text_6657c34670561c0127132da4'),
              },
              {
                label: translate('text_1773043324341gpkiojxh628'),
                value: recurring?.transactionName || '-',
              },
              {
                label: translate('text_1773043324341q5g4muycilq'),
                value: formatCredits(recurring?.paidCredits),
              },
              {
                label: translate('text_1773043324341cnkdf7j5dmp'),
                value: formatCredits(recurring?.grantedCredits),
              },
              ...(recurring?.trigger === RecurringTransactionTriggerEnum.Interval
                ? [
                    {
                      label: translate('text_6657c29c84ad4500ad764ee1'),
                      value: translate('text_1773043324341kgvvw9ykx6a'),
                    },
                    {
                      label: translate('text_1773043324341ht718cwl1ub'),
                      value: recurring?.interval
                        ? translate(getIntervalTranslationKey[recurring?.interval])
                        : '-',
                    },
                  ]
                : [
                    {
                      label: translate('text_6657c29c84ad4500ad764ee1'),
                      value: translate('text_1773043324341dd9c0u4ilhg'),
                    },
                    {
                      label: translate('text_6560809c38fb9de88d8a5315'),
                      value: recurring.thresholdCredits
                        ? translate(
                            'text_62da6ec24a8e24e44f812896',
                            {
                              amount: Number(recurring?.thresholdCredits),
                            },
                            Number(recurring?.thresholdCredits || 0),
                          )
                        : '-',
                    },
                  ]),
              {
                label: translate('text_1772536695408pz0actopowa'),
                value: wallet?.expirationAt
                  ? intlFormatDateTimeOrgaTZ(recurring?.expirationAt)?.date
                  : '-',
              },
            ]}
          />
        )}
      </section>
    </div>
  )
}

export default WalletInformations
