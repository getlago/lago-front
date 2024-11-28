import { gql } from '@apollo/client'
import { forwardRef, MutableRefObject, useEffect } from 'react'
import styled from 'styled-components'

import { Button, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  TimezoneEnum,
  useGetWalletTransactionsLazyQuery,
  WalletInfosForTransactionsFragment,
  WalletStatusEnum,
  WalletTransactionForTransactionListItemFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

import { TopupWalletDialogRef } from './TopupWalletDialog'
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
`

interface WalletTransactionListProps {
  customerTimezone?: TimezoneEnum
  isOpen: boolean
  wallet: WalletInfosForTransactionsFragment
}

export const WalletTransactionList = forwardRef<TopupWalletDialogRef, WalletTransactionListProps>(
  ({ customerTimezone, isOpen, wallet }: WalletTransactionListProps, ref) => {
    const { translate } = useInternationalization()
    const [getWalletTransactions, { data, error, fetchMore, loading, refetch }] =
      useGetWalletTransactionsLazyQuery({
        variables: { walletId: wallet.id, limit: 20 },
        notifyOnNetworkStatusChange: true,
      })
    const list = data?.walletTransactions?.collection
    const { currentPage = 0, totalPages = 0 } = data?.walletTransactions?.metadata || {}
    const hasData = !!list && !!list?.length

    useEffect(() => {
      if (isOpen && !data && !loading && !error) {
        getWalletTransactions()
      }
    }, [isOpen, error, data, loading, getWalletTransactions])

    return (
      <>
        {(loading || (!error && !!hasData)) && (
          <TransactionListHeader>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_62da6ec24a8e24e44f81288e')}
            </Typography>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_62da6ec24a8e24e44f812890')}
            </Typography>
          </TransactionListHeader>
        )}
        <TransactionListWrapper>
          {!!error && !loading ? (
            <GenericPlaceholder
              className="mx-auto py-6 text-center"
              title={translate('text_62d7ffcb1c57d7e6d15bdce3')}
              subtitle={translate('text_62d7ffcb1c57d7e6d15bdce5')}
              buttonTitle={translate('text_62d7ffcb1c57d7e6d15bdce7')}
              buttonVariant="primary"
              buttonAction={() => refetch()}
              image={<ErrorImage width="136" height="104" />}
            />
          ) : !!loading ? (
            [1, 2, 3].map((i) => (
              <Loader key={`wallet-transaction-skeleton-${i}`}>
                <Skeleton variant="connectorAvatar" size="big" className="mr-3" />
                <LeftLoader>
                  <Skeleton variant="text" className="mb-3 w-36" />
                  <Skeleton variant="text" className="w-20" />
                </LeftLoader>
                <RightLoader>
                  <Skeleton variant="text" className="mb-3 w-36" />
                  <Skeleton variant="text" className="w-20" />
                </RightLoader>
              </Loader>
            ))
          ) : !hasData && wallet?.status !== WalletStatusEnum.Terminated ? (
            <GenericPlaceholder
              className="mx-auto py-6 text-center"
              title={translate('text_62e0ee200a543924c8f67755')}
              subtitle={translate('text_62e0ee200a543924c8f67759')}
              buttonTitle={translate('text_62e0ee200a543924c8f6775d')}
              buttonVariant="primary"
              buttonAction={() => {
                ;(ref as MutableRefObject<TopupWalletDialogRef>)?.current?.openDialog()
              }}
              image={<EmptyImage width="136" height="104" />}
            />
          ) : (
            <>
              {list?.map((transaction, i) => {
                return (
                  <WalletTransactionListItem
                    key={`wallet-transaction-${i}`}
                    transaction={transaction}
                    customerTimezone={customerTimezone}
                  />
                )
              })}
              {currentPage < totalPages && (
                <Loadmore>
                  <Button
                    variant="quaternary"
                    onClick={() =>
                      fetchMore({
                        variables: { page: currentPage + 1 },
                      })
                    }
                  >
                    <Typography variant="body" color="grey600">
                      {translate('text_62da6ec24a8e24e44f8128aa')}
                    </Typography>
                  </Button>
                </Loadmore>
              )}
            </>
          )}
        </TransactionListWrapper>
      </>
    )
  },
)

const TransactionListHeader = styled.div`
  display: flex;
  padding: 10px ${theme.spacing(4)};
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const TransactionListWrapper = styled.div`
  box-shadow: ${theme.shadows[7]};
`

const Loadmore = styled.div`
  margin: ${theme.spacing(1)} 0;
  text-align: center;
`

const Loader = styled.div`
  display: flex;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
`

const LeftLoader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  margin-right: ${theme.spacing(2)};
`

const RightLoader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  flex: 1;
  margin-left: ${theme.spacing(2)};
`

WalletTransactionList.displayName = 'WalletTransactionList'
