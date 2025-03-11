import { gql } from '@apollo/client'
import { FC, ReactNode, useEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  WalletDetailsDrawer,
  WalletDetailsDrawerRef,
} from '~/components/wallets/WalletDetailsDrawer'
import { CREATE_WALLET_TOP_UP_ROUTE } from '~/core/router'
import {
  TimezoneEnum,
  useGetWalletTransactionsLazyQuery,
  WalletInfosForTransactionsFragment,
  WalletStatusEnum,
  WalletTransactionDetailsFragmentDoc,
  WalletTransactionForTransactionListItemFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

import { WalletTransactionListItem } from './WalletTransactionListItem'

gql`
  fragment WalletInfosForTransactions on Wallet {
    id
    currency
    status
    ongoingUsageBalanceCents
    creditsOngoingUsageBalance
  }

  query getWalletTransactions($walletId: ID!, $page: Int, $limit: Int) {
    walletTransactions(walletId: $walletId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...WalletTransactionForTransactionListItem
      }
    }
  }

  ${WalletTransactionForTransactionListItemFragmentDoc}
  ${WalletTransactionDetailsFragmentDoc}
`

interface WalletTransactionListProps {
  customerTimezone?: TimezoneEnum
  isOpen: boolean
  wallet: WalletInfosForTransactionsFragment
  footer: ReactNode
}

export const WalletTransactionList: FC<WalletTransactionListProps> = ({
  customerTimezone,
  isOpen,
  wallet,
  footer,
}) => {
  const { translate } = useInternationalization()
  const { customerId } = useParams()
  const navigate = useNavigate()
  const walletDetailsDrawerRef = useRef<WalletDetailsDrawerRef>(null)

  const [getWalletTransactions, { data, error, fetchMore, loading, refetch }] =
    useGetWalletTransactionsLazyQuery({
      variables: { walletId: wallet.id, limit: 20 },
      notifyOnNetworkStatusChange: true,
    })
  const list = data?.walletTransactions?.collection
  const { currentPage = 0, totalPages = 0 } = data?.walletTransactions?.metadata || {}

  const hasData = !!list && !!list?.length
  const hasError = !!error && !loading
  const isLoading = loading && !error
  const isWalletEmpty = !hasData && wallet?.status !== WalletStatusEnum.Terminated

  useEffect(() => {
    if (isOpen && !data && !loading && !error) {
      getWalletTransactions()
    }
  }, [isOpen, error, data, loading, getWalletTransactions])

  return (
    <>
      {(loading || (!error && !!hasData)) && (
        <div className="flex justify-between px-4 py-2 shadow-b">
          <Typography variant="captionHl">{translate('text_62da6ec24a8e24e44f81288e')}</Typography>
          <Typography
            variant="captionHl"
            className={tw(wallet.status === WalletStatusEnum.Active && 'mr-17')}
          >
            {translate('text_62da6ec24a8e24e44f812890')}
          </Typography>
        </div>
      )}
      <div className="shadow-b">
        {hasError && (
          <GenericPlaceholder
            className="mx-auto py-6 text-center"
            title={translate('text_62d7ffcb1c57d7e6d15bdce3')}
            subtitle={translate('text_62d7ffcb1c57d7e6d15bdce5')}
            buttonTitle={translate('text_62d7ffcb1c57d7e6d15bdce7')}
            buttonVariant="primary"
            buttonAction={() => refetch()}
            image={<ErrorImage width="136" height="104" />}
          />
        )}
        {isLoading &&
          [1, 2, 3].map((i) => (
            <div
              className="flex w-full gap-3 px-3 py-4 shadow-b"
              key={`wallet-transaction-skeleton-${i}`}
            >
              <Skeleton variant="connectorAvatar" size="big" className="mr-3" />
              <div className="flex flex-1 flex-col">
                <Skeleton variant="text" className="max-w-66" />
                <Skeleton variant="text" className="max-w-30" />
              </div>
              <div className="flex flex-1 flex-col items-end justify-end">
                <Skeleton variant="text" className="max-w-36" />
                <Skeleton variant="text" className="max-w-20" />
              </div>
            </div>
          ))}
        {!isLoading && isWalletEmpty && (
          <GenericPlaceholder
            className="mx-auto py-6 text-center"
            title={translate('text_62e0ee200a543924c8f67755')}
            subtitle={translate('text_62e0ee200a543924c8f67759')}
            buttonTitle={translate('text_62e0ee200a543924c8f6775d')}
            buttonVariant="primary"
            buttonAction={() => {
              navigate(
                generatePath(CREATE_WALLET_TOP_UP_ROUTE, {
                  customerId: customerId ?? null,
                  walletId: wallet.id,
                }),
              )
            }}
            image={<EmptyImage width="136" height="104" />}
          />
        )}
        {!isLoading && !isWalletEmpty && (
          <>
            {list?.map((transaction, i) => {
              return (
                <WalletTransactionListItem
                  key={`wallet-transaction-${i}`}
                  isWalletActive={wallet.status === WalletStatusEnum.Active}
                  transaction={transaction}
                  customerTimezone={customerTimezone}
                  onClick={() => {
                    walletDetailsDrawerRef.current?.openDrawer({ transactionId: transaction.id })
                  }}
                />
              )
            })}
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-1">
        {currentPage < totalPages && (
          <Button
            variant="quaternary"
            size="medium"
            onClick={() =>
              fetchMore({
                variables: { page: currentPage + 1 },
              })
            }
          >
            {translate('text_62da6ec24a8e24e44f8128aa')}
          </Button>
        )}
        {footer}
      </div>

      <WalletDetailsDrawer wallet={wallet} ref={walletDetailsDrawerRef} />
    </>
  )
}
