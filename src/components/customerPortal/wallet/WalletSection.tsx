import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'

import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderWalletSection } from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { Tooltip, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone/utils'
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
    paidTopUpMinAmountCents
    paidTopUpMaxAmountCents
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
            <Typography variant="body" color="grey600" className="flex h-6 items-center gap-2">
              {translate('text_1728377307160cbszddumfkg')}

              {wallet?.lastBalanceSyncAt && (
                <Tooltip
                  placement="top-start"
                  title={translate('text_1728470529877eb3qoinwqa5', {
                    date: intlFormatDateTime(wallet?.lastBalanceSyncAt, {
                      timezone: customerTimezone,
                      locale: documentLocale,
                    }).date,
                  })}
                >
                  <Icon size="medium" name="info-circle" />
                </Tooltip>
              )}
            </Typography>

            <div className="flex items-end gap-1">
              <Typography variant="headline" color="grey700">
                {unit}.{cents}
              </Typography>

              <Typography variant="bodyHl" color="grey700">
                {translate('text_62da6ec24a8e24e44f81287a', undefined, Number(unit) || 0)}
              </Typography>
            </div>

            <Typography variant="caption" color="grey600">
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
              <Typography variant="body" color="grey600">
                {translate('text_1728377307160dqj0b2q59f6')}
              </Typography>

              {wallet?.expirationAt ? (
                <>
                  <Typography variant="subhead2" color="grey700">
                    {
                      intlFormatDateTime(wallet?.expirationAt, {
                        timezone: customerTimezone,
                        locale: documentLocale,
                      }).date
                    }
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="subhead2" color="grey700">
                    {translate('text_62da6ec24a8e24e44f81288c')}
                  </Typography>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Typography variant="body" color="grey600">
                {translate('text_1728377307160sh06zbhqebt')}
              </Typography>

              <div className="flex items-center">
                <Typography variant="body" color="grey700">
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
