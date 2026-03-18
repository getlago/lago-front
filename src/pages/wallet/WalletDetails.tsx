import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import WalletActions from '~/components/wallets/WalletActions'
import WalletAlerts from '~/components/wallets/WalletAlerts'
import WalletInformations from '~/components/wallets/WalletInformations'
import { WalletTransactions } from '~/components/wallets/WalletTransactions'
import { CustomerDetailsTabsOptions } from '~/core/constants/tabsOptions'
import {
  CREATE_ALERT_WALLET_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  EDIT_WALLET_ROUTE,
  WALLET_DETAILS_ROUTE,
} from '~/core/router'
import {
  useGetWalletDetailsQuery,
  WalletInfosForTransactionsFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'

gql`
  fragment WalletDetails on Wallet {
    id
    code
    balanceCents
    consumedAmountCents
    consumedCredits
    createdAt
    creditsBalance
    currency
    expirationAt
    lastBalanceSyncAt
    lastConsumedCreditAt
    lastOngoingBalanceSyncAt
    name
    rateAmount
    status
    terminatedAt
    ongoingBalanceCents
    creditsOngoingBalance
    priority
    paidTopUpMinAmountCents
    paidTopUpMinCredits
    paidTopUpMaxAmountCents
    paymentMethodType
    paymentMethod {
      details {
        type
        brand
        last4
      }
    }
    selectedInvoiceCustomSections {
      id
      name
    }
    appliesTo {
      feeTypes
      billableMetrics {
        id
        name
        code
      }
    }
    recurringTransactionRules {
      method
      transactionName
      paidCredits
      grantedCredits
      trigger
      thresholdCredits
      expirationAt
      interval
    }

    ...WalletInfosForTransactions
  }

  query getWalletDetails($walletId: ID!) {
    wallet(id: $walletId) {
      ...WalletDetails
    }
  }

  ${WalletInfosForTransactionsFragmentDoc}
`
export enum WalletDetailsTabsOptionsEnum {
  overview = 'overview',
  transactions = 'transactions',
  alerts = 'alerts',
}

const SectionTitle = ({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) => (
  <div className="flex justify-between">
    <div className="flex flex-col gap-1">
      <Typography variant="subhead1">{title}</Typography>
      <Typography variant="caption">{description}</Typography>
    </div>

    {!!action && action}
  </div>
)

const WalletDetails = () => {
  const { translate } = useInternationalization()
  const { walletId, customerId } = useParams()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()

  const { data, error, loading } = useGetWalletDetailsQuery({
    variables: { walletId: walletId as string },
    skip: !walletId,
  })

  const wallet = data?.wallet

  const createdAtTitle = translate('text_62da6ec24a8e24e44f8128b2', {
    createdAt: intlFormatDateTimeOrgaTZ(wallet?.createdAt).date,
  })

  if (!loading && !!error) {
    return (
      <GenericPlaceholder
        title={translate('text_62e0ee200a543924c8f6775e')}
        subtitle={translate('text_62e0ee200a543924c8f67760')}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              navigate(
                generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                  customerId: customerId as string,
                  tab: CustomerDetailsTabsOptions.wallet,
                }),
              )
            }
          />

          <Typography variant="bodyHl" color="grey700" noWrap>
            {createdAtTitle}
          </Typography>
        </PageHeader.Group>

        <PageHeader.Group>
          <WalletActions
            walletId={walletId}
            customerId={customerId}
            status={wallet?.status}
            creditsBalance={wallet?.creditsBalance}
            trigger={(onClick) => (
              <Button endIcon="chevron-down" onClick={onClick}>
                {translate('text_634687079be251fdb438338f')}
              </Button>
            )}
            showActionsTooltip={false}
            rateAmount={wallet?.rateAmount}
            currency={wallet?.currency}
          />
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={loading}
        icon="wallet"
        title={wallet?.name || createdAtTitle || '-'}
        description={wallet?.code || ''}
      />

      <NavigationTab
        className="px-4 md:px-12"
        name="wallet-details-tabs"
        loading={loading}
        tabs={[
          {
            title: translate('text_1772536695408epr1ktf2hy9'),
            link: generatePath(WALLET_DETAILS_ROUTE, {
              walletId: walletId as string,
              customerId: customerId as string,
              tab: WalletDetailsTabsOptionsEnum.overview,
            }),
            component: (
              <DetailsPage.Container className="mt-12">
                <SectionTitle
                  title={translate('text_1772536695408epr1ktf2hy9')}
                  description={translate('text_177304332434241ihblh0jyp')}
                  action={
                    <>
                      {hasPermissions(['walletsUpdate']) && (
                        <ButtonLink
                          buttonProps={{
                            variant: 'quaternary',
                          }}
                          type="button"
                          to={generatePath(EDIT_WALLET_ROUTE, {
                            walletId: walletId as string,
                            customerId: customerId ?? null,
                          })}
                          data-test="edit-wallet"
                        >
                          {translate('text_62e161ceb87c201025388aa2')}
                        </ButtonLink>
                      )}
                    </>
                  }
                />

                <WalletInformations wallet={wallet} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1772536695408zfepv8jb948'),
            link: generatePath(WALLET_DETAILS_ROUTE, {
              walletId: walletId as string,
              customerId: customerId as string,
              tab: WalletDetailsTabsOptionsEnum.transactions,
            }),
            component: (
              <DetailsPage.Container className="mt-12 max-w-full gap-12">
                <SectionTitle
                  title={translate('text_1772536695408zfepv8jb948')}
                  description={translate('text_1773043324342ka1zcxto0pg')}
                />

                {!!wallet && (
                  <WalletTransactions
                    wallet={wallet}
                    premiumWarningDialogRef={premiumWarningDialogRef}
                    loading={loading}
                  />
                )}
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_177253669540873hdqaoks8e'),
            link: generatePath(WALLET_DETAILS_ROUTE, {
              walletId: walletId as string,
              customerId: customerId as string,
              tab: WalletDetailsTabsOptionsEnum.alerts,
            }),
            component: (
              <DetailsPage.Container className="mt-12 gap-8">
                <SectionTitle
                  title={translate('text_177253669540873hdqaoks8e')}
                  description={translate('text_1773043324342mrttreav4qk')}
                  action={
                    <>
                      {hasPermissions(['walletsUpdate']) && (
                        <ButtonLink
                          buttonProps={{
                            variant: 'quaternary',
                          }}
                          type="button"
                          to={generatePath(CREATE_ALERT_WALLET_ROUTE, {
                            walletId: walletId as string,
                            customerId: customerId ?? null,
                          })}
                          data-test="create-wallet-alert"
                        >
                          {translate('text_1773051593208ih6ikwtebg0')}
                        </ButtonLink>
                      )}
                    </>
                  }
                />

                {!!wallet && <WalletAlerts wallet={wallet} />}
              </DetailsPage.Container>
            ),
          },
        ]}
      />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default WalletDetails
