import { forwardRef, MutableRefObject } from 'react'
import { gql } from '@apollo/client'

import { Button, InfiniteScroll, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader, SideSection } from '~/styles/customer'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import {
  useGetCustomerWalletListQuery,
  WalletAccordionFragmentDoc,
  WalletInfosForTransactionsFragmentDoc,
} from '~/generated/graphql'

import { AddWalletToCustomerDialogRef } from './AddWalletToCustomerDialog'
import { WalletAccordion, WalletAccordionSkeleton } from './WalletAccordion'

gql`
  query getCustomerWalletList($customerId: ID!, $page: Int, $limit: Int) {
    wallets(customerId: $customerId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...WalletAccordion
        ...WalletInfosForTransactions
      }
    }
  }

  mutation addAddOn($input: CreateAppliedAddOnInput!) {
    createAppliedAddOn(input: $input) {
      id
    }
  }

  ${WalletAccordionFragmentDoc}
  ${WalletInfosForTransactionsFragmentDoc}
`

interface CustommerWalletListProps {
  customerId: string
  hasActiveWallet: boolean
}

export const CustomerWalletsList = forwardRef<
  AddWalletToCustomerDialogRef,
  CustommerWalletListProps
>(({ customerId, hasActiveWallet }: CustommerWalletListProps, ref) => {
  const { translate } = useInternationalization()
  const { data, error, loading, fetchMore } = useGetCustomerWalletListQuery({
    variables: { customerId, page: 0, limit: 20 },
  })
  const list = data?.wallets?.collection || []
  const hasNoWallet = !list || !list.length

  if (!loading && !!error) {
    return (
      <GenericPlaceholder
        title={translate('text_62d7ffcb1c57d7e6d15bdce3')}
        subtitle={translate('text_62d7ffcb1c57d7e6d15bdce5')}
        buttonTitle={translate('text_62d7ffcb1c57d7e6d15bdce7')}
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
        <Button
          variant="quaternary"
          onClick={() => {
            if (hasActiveWallet) {
              // TODO: Add edit dropdown
            } else {
              ;(ref as MutableRefObject<AddWalletToCustomerDialogRef>)?.current?.openDialog()
            }
          }}
        >
          {hasActiveWallet
            ? 'TODO: edit button dropdown translation'
            : translate('text_62d175066d2dbf1d50bc9382')}
        </Button>
      </SectionHeader>

      {!!loading ? (
        <>
          {[1, 2, 3].map((i) => (
            <WalletAccordionSkeleton key={`customer-wallet-skeleton-${i}`} />
          ))}
        </>
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
          <>
            {list.map((wallet) => (
              <WalletAccordion key={`wallet-${wallet.id}`} wallet={wallet} />
            ))}
          </>
        </InfiniteScroll>
      )}
    </SideSection>
  )
})

CustomerWalletsList.displayName = 'CustomerWalletsList'
