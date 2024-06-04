import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Button, InfiniteScroll, Popper, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { CREATE_WALLET_ROUTE, EDIT_WALLET_ROUTE } from '~/core/router'
import {
  TimezoneEnum,
  useGetCustomerWalletListQuery,
  WalletAccordionFragmentDoc,
  WalletForTopupFragmentDoc,
  WalletForUpdateFragmentDoc,
  WalletInfosForTransactionsFragmentDoc,
  WalletStatusEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, theme } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import {
  TerminateCustomerWalletDialog,
  TerminateCustomerWalletDialogRef,
} from './TerminateCustomerWalletDialog'
import { TopupWalletDialog, TopupWalletDialogRef } from './TopupWalletDialog'
import { VoidWalletDialog, VoidWalletDialogRef } from './VoidWalletDialog'
import { WalletAccordion, WalletAccordionSkeleton } from './WalletAccordion'

import { PremiumWarningDialog, PremiumWarningDialogRef } from '../PremiumWarningDialog'

gql`
  fragment CustomerWallet on Wallet {
    ...WalletForTopup
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

  ${WalletForTopupFragmentDoc}
  ${WalletForUpdateFragmentDoc}
  ${WalletAccordionFragmentDoc}
  ${WalletInfosForTransactionsFragmentDoc}
`

interface CustommerWalletListProps {
  customerId: string
  customerTimezone?: TimezoneEnum
}

export const CustomerWalletsList = ({ customerId, customerTimezone }: CustommerWalletListProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const terminateCustomerWalletDialogRef = useRef<TerminateCustomerWalletDialogRef>(null)
  const topupWalletDialogRef = useRef<TopupWalletDialogRef>(null)
  const voidWalletDialogRef = useRef<VoidWalletDialogRef>(null)
  const { data, error, loading, fetchMore } = useGetCustomerWalletListQuery({
    variables: { customerId, page: 0, limit: 20 },
  })
  const list = data?.wallets?.collection || []
  const hasNoWallet = !list || !list.length
  const activeWallet = list.find((wallet) => wallet.status === WalletStatusEnum.Active)
  const hasAnyPermissionsToShowActions = hasPermissions([
    'walletsCreate',
    'walletsTopUp',
    'walletsUpdate',
    'walletsTerminate',
  ])

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
      <SideSection $empty={!!hasNoWallet}>
        <SectionHeader variant="subhead" $hideBottomShadow={!!loading || !hasNoWallet}>
          {translate('text_62d175066d2dbf1d50bc9384')}

          {hasAnyPermissionsToShowActions && (
            <>
              {!activeWallet && hasPermissions(['walletsCreate']) ? (
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
              ) : (
                <Popper
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={
                    <Button variant="quaternary" endIcon="chevron-down">
                      {translate('text_62e161ceb87c201025388aa2')}
                    </Button>
                  }
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      {hasPermissions(['walletsTopUp']) && (
                        <Button
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            topupWalletDialogRef?.current?.openDialog()
                            closePopper()
                          }}
                        >
                          {translate('text_62e161ceb87c201025388ada')}
                        </Button>
                      )}

                      {hasPermissions(['walletsUpdate']) && (
                        <Button
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            navigate(
                              generatePath(EDIT_WALLET_ROUTE, {
                                customerId: customerId as string,
                                walletId: activeWallet?.id as string,
                              }),
                            )
                            closePopper()
                          }}
                        >
                          {translate('text_62e161ceb87c201025388aa2')}
                        </Button>
                      )}

                      {hasPermissions(['walletsTerminate']) && (
                        <>
                          <Button
                            variant="quaternary"
                            align="left"
                            disabled={(activeWallet?.creditsBalance || 0) <= 0}
                            onClick={() => {
                              voidWalletDialogRef.current?.openDialog()
                              closePopper()
                            }}
                          >
                            {translate('text_63720bd734e1344aea75b7e9')}
                          </Button>

                          <Button
                            variant="quaternary"
                            align="left"
                            onClick={() => {
                              terminateCustomerWalletDialogRef?.current?.openDialog()
                              closePopper()
                            }}
                          >
                            {translate('text_62e161ceb87c201025388ade')}
                          </Button>
                        </>
                      )}
                    </MenuPopper>
                  )}
                </Popper>
              )}
            </>
          )}
        </SectionHeader>

        {!!loading ? (
          <WalletList>
            {[1, 2, 3].map((i) => (
              <WalletAccordionSkeleton key={`customer-wallet-skeleton-${i}`} />
            ))}
          </WalletList>
        ) : !loading && !!hasNoWallet ? (
          <Typography>{translate('text_62d175066d2dbf1d50bc9386')}</Typography>
        ) : (
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
            <WalletList>
              {list.map((wallet) => (
                <WalletAccordion
                  key={`wallet-${wallet.id}`}
                  premiumWarningDialogRef={premiumWarningDialogRef}
                  wallet={wallet}
                  ref={topupWalletDialogRef}
                  customerTimezone={customerTimezone}
                />
              ))}
            </WalletList>
          </InfiniteScroll>
        )}

        {activeWallet && (
          <>
            <TopupWalletDialog ref={topupWalletDialogRef} wallet={activeWallet} />
            <TerminateCustomerWalletDialog
              ref={terminateCustomerWalletDialogRef}
              walletId={activeWallet.id}
            />
            <VoidWalletDialog ref={voidWalletDialogRef} wallet={activeWallet} />
          </>
        )}
      </SideSection>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

const WalletList = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

CustomerWalletsList.displayName = 'CustomerWalletsList'
