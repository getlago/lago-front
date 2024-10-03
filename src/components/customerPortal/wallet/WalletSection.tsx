import { gql } from '@apollo/client'

import SectionContainer from '~/components/customerPortal/common/SectionContainer'
import SectionLoading from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone/utils'
import { TimezoneEnum, useGetPortalWalletsQuery, WalletStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomerPortalWalletInfo on CustomerPortalWallet {
    id
    currency
    balanceCents
    creditsBalance
    expirationAt
    consumedCredits
    consumedAmountCents
    status
    creditsOngoingBalance
    creditsBalance
    rateAmount
  }

  query getPortalCustomerTimezone {
    customerPortalUser {
      applicableTimezone
    }
  }

  query getPortalWallets {
    customerPortalWallets {
      collection {
        ...CustomerPortalWalletInfo
      }
    }
  }
`

type WalletSectionProps = {
  viewWallet: () => void
}

const WalletSection = ({ viewWallet }: WalletSectionProps) => {
  const { translate } = useInternationalization()

  const {
    data: customerWalletData,
    loading: customerWalletLoading,
    error: customerLoadingError,
  } = useGetPortalWalletsQuery()

  const customerTimezone = TimezoneEnum.TzUtc

  const wallet = customerWalletData?.customerPortalWallets?.collection?.[0]

  const isWalletActive = wallet?.status === WalletStatusEnum.Active

  let [creditAmountUnit = '0', creditAmountCents = '00'] = String(wallet?.creditsBalance).split('.')

  let [consumedCreditUnit = '0', consumedCreditCents = '00'] = String(
    wallet?.creditsOngoingBalance,
  ).split('.')

  if (!customerWalletLoading && !isWalletActive) {
    return null
  }

  if (customerLoadingError) {
    return (
      <section>
        <SectionTitle title={translate('TODO: Wallet')}>Error</SectionTitle>
      </section>
    )
  }

  return (
    <SectionContainer>
      <SectionTitle title={translate('TODO: Wallet')} className="justify-between">
        <span className="cursor-pointer text-blue-600" onClick={viewWallet} role="presentation">
          {translate('TODO: Top up wallet')}
        </span>
      </SectionTitle>

      {customerWalletLoading && <SectionLoading />}

      {!customerWalletLoading && wallet && (
        <div>
          <div className="flex flex-col">
            <h6 className="text-sm font-normal text-grey-600">{translate('TODO: Balance')}</h6>

            <div className="flex items-end gap-1">
              <h3 className="text-2xl font-semibold text-grey-700">
                {creditAmountUnit}.{creditAmountCents}
              </h3>

              <span className="text-sm font-medium leading-6 text-grey-700">
                {translate(
                  'text_62da6ec24a8e24e44f81287a',
                  undefined,
                  Number(creditAmountUnit) || 0,
                )}
              </span>
            </div>

            <span className="text-xs font-normal text-grey-600">
              {intlFormatNumber(deserializeAmount(wallet.balanceCents, wallet.currency), {
                currencyDisplay: 'symbol',
                currency: wallet.currency,
              })}{' '}
              {translate('TODO: of credits')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2">
            <div className="flex flex-col">
              <span className="text-sm font-normal text-grey-600">
                {translate('TODO: Expiry date')}
              </span>

              {wallet?.expirationAt ? (
                <span className="text-base font-normal text-grey-700">
                  {formatDateToTZ(wallet?.expirationAt, customerTimezone)}
                </span>
              ) : (
                <p className="text-base font-normal text-grey-700">
                  {translate('text_62da6ec24a8e24e44f81288c')}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-normal text-grey-600">
                {translate('TODO: Total credits used')}
              </span>

              <div className="flex items-center">
                <span className="text-grey-700">
                  {wallet?.consumedCredits}.{consumedCreditCents}{' '}
                  {translate(
                    'text_62da6ec24a8e24e44f812884',
                    undefined,
                    Number(consumedCreditUnit) || 0,
                  )}{' '}
                  (
                  {intlFormatNumber(
                    deserializeAmount(wallet?.consumedAmountCents, wallet.currency),
                    {
                      currencyDisplay: 'symbol',
                      currency: wallet.currency,
                    },
                  )}
                  )
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  )
}

export default WalletSection
