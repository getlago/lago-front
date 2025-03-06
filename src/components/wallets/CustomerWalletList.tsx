import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WalletAccordion, WalletAccordionSkeleton } from '~/components/wallets/WalletAccordion'
import { CREATE_WALLET_ROUTE, CREATE_WALLET_TOP_UP_ROUTE } from '~/core/router'
import {
  TimezoneEnum,
  useGetCustomerWalletListQuery,
  WalletAccordionFragmentDoc,
  WalletForUpdateFragmentDoc,
  WalletInfosForTransactionsFragmentDoc,
  WalletStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment CustomerWallet on Wallet {
    ...WalletForUpdate
    ...WalletAccordion
    ...WalletInfosForTransactions
  }

  query getCustomerWalletList($customerId: ID!, $page: Int, $limit: Int) {
    wallets(customerId: $customerId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CustomerWallet
      }
    }
  }

  ${WalletForUpdateFragmentDoc}
  ${WalletAccordionFragmentDoc}
  ${WalletInfosForTransactionsFragmentDoc}
`

interface CustomerWalletListProps {
  customerId: string
  customerTimezone?: TimezoneEnum
}

export const CustomerWalletsList = ({ customerId, customerTimezone }: CustomerWalletListProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const { data, error, loading, fetchMore } = useGetCustomerWalletListQuery({
    variables: { customerId, page: 0, limit: 20 },
  })
  const list = data?.wallets?.collection || []
  const hasNoWallet = !list || !list.length
  const activeWallet = list.find((wallet) => wallet.status === WalletStatusEnum.Active)

  if (!loading && !!error) {
    return (
      <GenericPlaceholder
        title={translate('text_62e0ee200a543924c8f6775e')}
        subtitle={translate('text_62e0ee200a543924c8f67760')}
        buttonTitle={translate('text_62e0ee200a543924c8f67762')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageSectionTitle
        title={translate('text_62d175066d2dbf1d50bc9384')}
        subtitle={translate('text_1737647019083bbxjrexen5s')}
        customAction={
          <>
            {!activeWallet && hasPermissions(['walletsCreate']) && (
              <Button
                variant="quaternary"
                onClick={() =>
                  navigate(
                    generatePath(CREATE_WALLET_ROUTE, {
                      customerId: customerId as string,
                    }),
                  )
                }
              >
                {translate('text_62d175066d2dbf1d50bc9382')}
              </Button>
            )}
            {activeWallet && hasPermissions(['walletsTopUp']) && (
              <Button
                variant="quaternary"
                onClick={() =>
                  navigate(
                    generatePath(CREATE_WALLET_TOP_UP_ROUTE, {
                      customerId: customerId,
                      walletId: activeWallet.id,
                    }),
                  )
                }
              >
                {translate('text_62e161ceb87c201025388ada')}
              </Button>
            )}
          </>
        }
      />

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <WalletAccordionSkeleton key={`customer-wallet-skeleton-${i}`} />
          ))}
        </div>
      )}

      {!loading && hasNoWallet && (
        <Typography className="text-grey-500">
          {translate('text_62d175066d2dbf1d50bc9386')}
        </Typography>
      )}

      {!loading && !hasNoWallet && (
        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = data?.wallets?.metadata || {}

            currentPage < totalPages &&
              !loading &&
              fetchMore({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          <div className="flex flex-col gap-4">
            {list.map((wallet) => (
              <WalletAccordion
                key={`wallet-${wallet.id}`}
                premiumWarningDialogRef={premiumWarningDialogRef}
                wallet={wallet}
                customerTimezone={customerTimezone}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}
