import { gql } from '@apollo/client'
import { Tooltip } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WalletAccordion, WalletAccordionSkeleton } from '~/components/wallets/WalletAccordion'
import { CREATE_WALLET_ROUTE } from '~/core/router'
import {
  TimezoneEnum,
  useGetCustomerWalletListQuery,
  WalletAccordionFragmentDoc,
  WalletForUpdateFragmentDoc,
  WalletInfosForTransactionsFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

const ACTIVE_WALLET_COUNT_LIMIT = 1

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
        customerActiveWalletsCount
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
    variables: { customerId, page: 0, limit: 10 },
  })
  const walletsCollection = data?.wallets?.collection || []
  const hasMoreThanActiveWalletsLimit =
    (data?.wallets?.metadata?.customerActiveWalletsCount || 0) >= ACTIVE_WALLET_COUNT_LIMIT

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
            {hasPermissions(['walletsCreate']) && (
              <Tooltip
                title={translate(
                  'text_176071328361044kwwdb4re4',
                  {
                    count: ACTIVE_WALLET_COUNT_LIMIT,
                  },
                  ACTIVE_WALLET_COUNT_LIMIT,
                )}
                disableHoverListener={!hasMoreThanActiveWalletsLimit}
              >
                <Button
                  variant="inline"
                  disabled={hasMoreThanActiveWalletsLimit || loading}
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
              </Tooltip>
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

      {!loading && !walletsCollection.length && (
        <Typography className="text-grey-500">
          {translate('text_62d175066d2dbf1d50bc9386')}
        </Typography>
      )}

      {!loading && !!walletsCollection.length && (
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
            {walletsCollection.map((wallet) => (
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
