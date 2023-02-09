import { forwardRef, MutableRefObject, useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Button, InfiniteScroll, Popper, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader, SideSection } from '~/styles/customer'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import {
  useGetCustomerWalletListQuery,
  WalletAccordionFragmentDoc,
  WalletForTopupFragmentDoc,
  WalletForUpdateFragmentDoc,
  WalletInfosForTransactionsFragmentDoc,
  WalletStatusEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { MenuPopper, theme } from '~/styles'

import { AddWalletToCustomerDialogRef } from './AddWalletToCustomerDialog'
import { WalletAccordion, WalletAccordionSkeleton } from './WalletAccordion'
import {
  UpdateCustomerWalletDialog,
  UpdateCustomerWalletDialogRef,
} from './UpdateCustomerWalletDialog'
import {
  TerminateCustomerWalletDialog,
  TerminateCustomerWalletDialogRef,
} from './TerminateCustomerWalletDialog'
import { TopupWalletDialog, TopupWalletDialogRef } from './TopupWalletDialog'

gql`
  query getCustomerWalletList($customerId: ID!, $page: Int, $limit: Int) {
    wallets(customerId: $customerId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...WalletForTopup
        ...WalletForUpdate
        ...WalletAccordion
        ...WalletInfosForTransactions
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
  customerTimezone: TimezoneEnum
}

export const CustomerWalletsList = forwardRef<
  AddWalletToCustomerDialogRef,
  CustommerWalletListProps
>(({ customerId, customerTimezone }: CustommerWalletListProps, ref) => {
  const { translate } = useInternationalization()
  const updateCustomerWalletDialogRef = useRef<UpdateCustomerWalletDialogRef>(null)
  const terminateCustomerWalletDialogRef = useRef<TerminateCustomerWalletDialogRef>(null)
  const topupWalletDialogRef = useRef<TopupWalletDialogRef>(null)
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
    <SideSection $empty={!!hasNoWallet}>
      <SectionHeader variant="subhead" $hideBottomShadow={!!loading || !hasNoWallet}>
        {translate('text_62d175066d2dbf1d50bc9384')}
        {!activeWallet ? (
          <Button
            variant="quaternary"
            onClick={() =>
              (ref as MutableRefObject<AddWalletToCustomerDialogRef>)?.current?.openDialog()
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
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    updateCustomerWalletDialogRef?.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_62e161ceb87c201025388adc')}
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
              </MenuPopper>
            )}
          </Popper>
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
          <UpdateCustomerWalletDialog ref={updateCustomerWalletDialogRef} wallet={activeWallet} />
          <TerminateCustomerWalletDialog
            ref={terminateCustomerWalletDialogRef}
            walletId={activeWallet.id}
          />
        </>
      )}
    </SideSection>
  )
})

const WalletList = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

CustomerWalletsList.displayName = 'CustomerWalletsList'
