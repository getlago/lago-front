import { gql } from '@apollo/client'

import SectionContainer from '~/components/customerPortal/common/SectionContainer'
import SectionError from '~/components/customerPortal/common/SectionError'
import SectionLoading from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import { Icon, Tooltip } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone/utils'
import {
  useGetPortalCustomerDataQuery,
  useGetPortalWalletsQuery,
  WalletStatusEnum,
} from '~/generated/graphql'
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
    ongoingBalanceCents
    rateAmount
    lastBalanceSyncAt
  }

  query getPortalCustomerData {
    customerPortalUser {
      applicableTimezone
      premium
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
    data: customerPortalUserData,
    loading: customerPortalUserLoading,
    error: customerPortalUserError,
    refetch: customerPortalUserRefetch,
  } = useGetPortalCustomerDataQuery()

  const customerPortalUser = customerPortalUserData?.customerPortalUser
  const customerTimezone = customerPortalUser?.applicableTimezone
  const isPremium = customerPortalUser?.premium

  const {
    data: customerWalletData,
    loading: customerWalletLoading,
    error: customerWalletError,
    refetch: customerWalletRefetch,
  } = useGetPortalWalletsQuery()

  const wallet = customerWalletData?.customerPortalWallets?.collection?.[0]
  const isWalletActive = wallet?.status === WalletStatusEnum.Active

  const [creditAmountUnit = '0', creditAmountCents = '00'] = String(wallet?.creditsBalance).split(
    '.',
  )
  const [consumedCreditUnit = '0', consumedCreditCents = '00'] = String(
    wallet?.creditsOngoingBalance,
  ).split('.')

  const [unit, cents, balance] = isPremium
    ? [consumedCreditUnit, consumedCreditCents, wallet?.ongoingBalanceCents]
    : [creditAmountUnit, creditAmountCents, wallet?.balanceCents]

  const isLoading = customerWalletLoading || customerPortalUserLoading
  const isError = !isLoading && (customerWalletError || customerPortalUserError)

  const refreshSection = () => {
    customerPortalUserError && customerPortalUserRefetch()
    customerWalletError && customerWalletRefetch()
  }

  if (!isLoading && isError) {
    return (
      <section>
        <SectionTitle title={translate('text_1728377307159q3otzyv9tey')} />

        <SectionError refresh={refreshSection} />
      </section>
    )
  }

  if (!isLoading && !isWalletActive) {
    return null
  }

  return (
    <SectionContainer>
      <SectionTitle
        title={translate('text_1728377307159q3otzyv9tey')}
        className="justify-between"
        action={{ title: translate('text_1728377307160cludx1c0cfb'), onClick: viewWallet }}
        loading={isLoading}
      />

      {isLoading && <SectionLoading variant="wallet-section" />}

      {!isLoading && wallet && (
        <div>
          <div className="flex flex-col gap-1">
            <h6 className="flex h-6 items-center gap-2 text-sm font-normal text-grey-600">
              {translate('text_1728377307160cbszddumfkg')}

              {wallet?.lastBalanceSyncAt && (
                <Tooltip
                  placement="top-start"
                  title={translate('text_1728470529877eb3qoinwqa5', {
                    date: formatDateToTZ(wallet?.lastBalanceSyncAt, customerTimezone),
                  })}
                >
                  <Icon size="medium" name="info-circle" />
                </Tooltip>
              )}
            </h6>

            <div className="flex items-end gap-1">
              <h3 className="text-2xl font-semibold text-grey-700">
                {unit}.{cents}
              </h3>

              <span className="text-sm font-medium leading-6 text-grey-700">
                {translate('text_62da6ec24a8e24e44f81287a', undefined, Number(unit) || 0)}
              </span>
            </div>

            <span className="text-xs font-normal text-grey-600">
              {intlFormatNumber(deserializeAmount(balance, wallet.currency), {
                currencyDisplay: 'symbol',
                currency: wallet.currency,
              })}{' '}
              {translate('text_17283773071600j3nukyme6f')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-normal leading-6 text-grey-600">
                {translate('text_1728377307160dqj0b2q59f6')}
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

            <div className="flex flex-col gap-1">
              <span className="text-sm font-normal leading-6 text-grey-600">
                {translate('text_1728377307160sh06zbhqebt')}
              </span>

              <div className="flex items-center">
                <span className="text-grey-700">
                  {wallet?.consumedCredits}{' '}
                  {translate(
                    'text_62da6ec24a8e24e44f812884',
                    undefined,
                    Number(wallet?.consumedCredits) || 0,
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
