import { gql } from '@apollo/client'
import { Button, Typography } from 'lago-design-system'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { PaymentsList } from '~/components/invoices/PaymentsList'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { SearchInput } from '~/components/SearchInput'
import { CREATE_PAYMENT_ROUTE } from '~/core/router'
import { PaymentForPaymentsListFragmentDoc, useGetPaymentsListLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { PageHeader } from '~/styles'

gql`
  query getPaymentsList(
    $invoiceId: ID
    $externalCustomerId: ID
    $limit: Int
    $page: Int
    $searchTerm: String
  ) {
    payments(
      invoiceId: $invoiceId
      externalCustomerId: $externalCustomerId
      limit: $limit
      page: $page
      searchTerm: $searchTerm
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...PaymentForPaymentsList
      }
    }
  }

  ${PaymentForPaymentsListFragmentDoc}
`

const PaymentsPage = () => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const navigate = useNavigate()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const [getPayments, { data, loading, error, fetchMore, variables }] = useGetPaymentsListLazyQuery(
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: {
        limit: 20,
      },
    },
  )

  const { debouncedSearch: paymentsDebounceSearch, isLoading: paymentsIsLoading } =
    useDebouncedSearch(getPayments, loading)

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_6672ebb8b1b50be550eccbed')}
        </Typography>

        <PageHeader.Group>
          <SearchInput
            onChange={paymentsDebounceSearch}
            placeholder={translate('text_17370296250897aidak5kjcg')}
          />
          <Button
            variant="primary"
            onClick={() => {
              if (isPremium) {
                navigate(CREATE_PAYMENT_ROUTE)
              } else {
                premiumWarningDialogRef.current?.openDialog()
              }
            }}
            endIcon={isPremium ? undefined : 'sparkles'}
          >
            {translate('text_1737471851634wpeojigr27w')}
          </Button>
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <PaymentsList
        error={error}
        fetchMore={fetchMore}
        payments={data?.payments?.collection}
        isLoading={paymentsIsLoading}
        metadata={data?.payments?.metadata}
        variables={variables}
      />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default PaymentsPage
