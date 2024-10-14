import { gql } from '@apollo/client'

import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderWalletSection } from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { Icon, Tooltip, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateToDateMed } from '~/core/timezone/utils'
import {
  useGetPortalCustomerDataQuery,
  useGetPortalWalletsQuery,
  WalletStatusEnum,
} from '~/generated/graphql'

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
  const { translate, documentLocale } = useCustomerPortalTranslate()

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

  if (isError) {
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
    <div>
      <SectionTitle
        title={translate('text_1728377307159q3otzyv9tey')}
        className="justify-between"
        action={{ title: translate('text_1728377307160cludx1c0cfb'), onClick: viewWallet }}
        loading={isLoading}
      />

      {isLoading && <LoaderWalletSection />}

      {!isLoading && wallet && (
        <div>
          <div className="flex flex-col gap-1">
            <Typography className="flex h-6 items-center gap-2 text-sm font-normal text-grey-600">
              {translate('text_1728377307160cbszddumfkg')}

              {wallet?.lastBalanceSyncAt && (
                <Tooltip
                  placement="top-start"
                  title={translate('text_1728470529877eb3qoinwqa5', {
                    date: intlFormatDateToDateMed(
                      wallet?.lastBalanceSyncAt,
                      customerTimezone,
                      documentLocale,
                    ),
                  })}
                >
                  <Icon size="medium" name="info-circle" />
                </Tooltip>
              )}
            </Typography>

            <div className="flex items-end gap-1">
              <Typography className="text-2xl font-semibold text-grey-700">
                {unit}.{cents}
              </Typography>

              <Typography className="text-sm font-medium leading-6 text-grey-700">
                {translate('text_62da6ec24a8e24e44f81287a', undefined, Number(unit) || 0)}
              </Typography>
            </div>

            <Typography className="text-xs font-normal text-grey-600">
              {translate('text_17283773071600j3nukyme6f', {
                credits: intlFormatNumber(deserializeAmount(balance, wallet.currency), {
                  currencyDisplay: 'narrowSymbol',
                  currency: wallet.currency,
                  locale: documentLocale,
                }),
              })}
            </Typography>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <Typography className="text-sm font-normal leading-6 text-grey-600">
                {translate('text_1728377307160dqj0b2q59f6')}
              </Typography>

              {wallet?.expirationAt ? (
                <>
                  <Typography className="text-base font-normal text-grey-700">
                    {intlFormatDateToDateMed(
                      wallet?.expirationAt,
                      customerTimezone,
                      documentLocale,
                    )}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography className="text-base font-normal text-grey-700">
                    {translate('text_62da6ec24a8e24e44f81288c')}
                  </Typography>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Typography className="text-sm font-normal leading-6 text-grey-600">
                {translate('text_1728377307160sh06zbhqebt')}
              </Typography>

              <div className="flex items-center">
                <Typography className="text-grey-700">
                  {wallet?.consumedCredits}&nbsp;
                  {translate(
                    'text_62da6ec24a8e24e44f812884',
                    undefined,
                    Number(wallet?.consumedCredits) || 0,
                  )}
                  &nbsp; (
                  {intlFormatNumber(
                    deserializeAmount(wallet?.consumedAmountCents, wallet.currency),
                    {
                      currencyDisplay: 'narrowSymbol',
                      currency: wallet.currency,
                      locale: documentLocale,
                    },
                  )}
                  )
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletSection
