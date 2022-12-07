import { forwardRef, MutableRefObject, useEffect } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { theme } from '~/styles'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  useGetWalletTransactionsLazyQuery,
  WalletInfosForTransactionsFragment,
  WalletStatusEnum,
  WalletTransactionStatusEnum,
  WalletTransactionTransactionTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { TimezoneDate } from '~/components/TimezoneDate'

import { TopupWalletDialogRef } from './TopupWalletDialog'

gql`
  query getWalletTransactions($walletId: ID!, $page: Int, $limit: Int) {
    walletTransactions(walletId: $walletId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        status
        transactionType
        amount
        creditAmount
        settledAt
        createdAt
      }
    }
  }

  fragment WalletInfosForTransactions on Wallet {
    id
    currency
    status
  }
`

interface WalletTransactionListProps {
  isOpen: boolean
  wallet: WalletInfosForTransactionsFragment
  customerTimezone: TimezoneEnum
}

export const WalletTransactionList = forwardRef<TopupWalletDialogRef, WalletTransactionListProps>(
  ({ isOpen, wallet, customerTimezone }: WalletTransactionListProps, ref) => {
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
            <GenericState
              title={translate('text_62d7ffcb1c57d7e6d15bdce3')}
              subtitle={translate('text_62d7ffcb1c57d7e6d15bdce5')}
              buttonTitle={translate('text_62d7ffcb1c57d7e6d15bdce7')}
              buttonVariant="primary"
              buttonAction={() => refetch()}
              image={<ErrorImage width="136" height="104" />}
            />
          ) : !!loading ? (
            [1, 2, 3].map((i) => (
              <ListItemWrapper key={`wallet-transaction-skeleton-${i}`}>
                <ListLeftWrapper>
                  <Skeleton
                    variant="connectorAvatar"
                    size="medium"
                    marginRight={theme.spacing(3)}
                  />
                  <ColumnWrapper>
                    <Skeleton
                      variant="text"
                      height={12}
                      width={144}
                      marginBottom={theme.spacing(3)}
                    />
                    <Skeleton variant="text" height={12} width={80} />
                  </ColumnWrapper>
                </ListLeftWrapper>
                <ListRightWrapper>
                  <Skeleton
                    variant="text"
                    height={12}
                    width={144}
                    marginBottom={theme.spacing(3)}
                  />
                  <Skeleton variant="text" height={12} width={80} />
                </ListRightWrapper>
              </ListItemWrapper>
            ))
          ) : !hasData && wallet?.status !== WalletStatusEnum.Terminated ? (
            <GenericState
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
                const { amount, createdAt, creditAmount, settledAt, status, transactionType } =
                  transaction
                const isPending = status === WalletTransactionStatusEnum.Pending
                const isInbound = transactionType === WalletTransactionTransactionTypeEnum.Inbound
                const iconName = isPending ? 'sync' : isInbound ? 'plus' : 'minus'

                return (
                  <ListItemWrapper key={`wallet-transaction-${i}`}>
                    <ListLeftWrapper>
                      <ItemIcon variant="connector">
                        <Icon name={iconName} color="dark" />
                      </ItemIcon>
                      <ColumnWrapper>
                        <Typography variant="bodyHl" color={isPending ? 'grey600' : 'grey700'}>
                          {isInbound
                            ? translate(
                                'text_62da6ec24a8e24e44f81289a',
                                undefined,
                                Number(creditAmount) || 0
                              )
                            : translate(
                                'text_62da6ec24a8e24e44f812892',
                                undefined,
                                Number(creditAmount) || 0
                              )}
                        </Typography>
                        <DateBlock variant="caption" color="grey600">
                          <TimezoneDate
                            mainTypographyProps={{ variant: 'caption', color: 'grey600' }}
                            date={isPending ? createdAt : settledAt}
                            customerTimezone={customerTimezone}
                          />
                          {isPending && ` • ${translate('text_62da6db136909f52c2704c30')}`}
                        </DateBlock>
                      </ColumnWrapper>
                    </ListLeftWrapper>
                    <ListRightWrapper>
                      <Typography
                        variant="body"
                        color={isPending ? 'grey600' : isInbound ? 'success600' : 'grey700'}
                      >
                        {isInbound ? '+ ' : '- '}
                        {translate(
                          'text_62da6ec24a8e24e44f812896',
                          {
                            amount: intlFormatNumber(Number(creditAmount) || 0, {
                              maximumFractionDigits: 5,
                              style: 'decimal',
                            }),
                          },
                          Number(creditAmount) || 0
                        )}
                      </Typography>
                      <Typography variant="caption" color="grey600">
                        {intlFormatNumber(Number(amount) || 0, {
                          currencyDisplay: 'symbol',
                          maximumFractionDigits: 5,
                          currency: wallet?.currency,
                        })}
                      </Typography>
                    </ListRightWrapper>
                  </ListItemWrapper>
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
  }
)

const TransactionListHeader = styled.div`
  display: flex;
  padding: 10px ${theme.spacing(4)};
  justify-content: space-between;
  box-shadow: ${theme.shadows[5]}, ${theme.shadows[7]};
`

const TransactionListWrapper = styled.div`
  > *:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const GenericState = styled(GenericPlaceholder)`
  padding: ${theme.spacing(6)} 0;
  margin: 0 auto;
  text-align: center;
`

const ListItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
`

const ListLeftWrapper = styled.div`
  display: flex;
  align-items: center;

  &:last-child {
    align-items: flex-end;
  }
`

const ItemIcon = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const ListRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
`

const ColumnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`

const Loadmore = styled.div`
  margin: ${theme.spacing(1)} 0;
  text-align: center;
`

const DateBlock = styled(Typography)`
  display: flex;
  align-items: baseline;

  > * {
    margin-right: ${theme.spacing(1)};
  }
`

WalletTransactionList.displayName = 'WalletTransactionList'
