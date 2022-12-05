import { gql } from '@apollo/client'
import styled from 'styled-components'

import {
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceInfosForCustomerDraftInvoicesListFragmentDoc,
  InvoiceInfosForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'

import { InvoicesList } from './InvoicesList'

const DRAFT_INVOICES_ITEMS_COUNT = 5

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
  ) {
    customerInvoices(customerId: $customerId, limit: $limit, page: $page, status: $status) {
      ...InvoiceInfosForInvoiceList
      collection {
        status
        ...InvoiceForFinalizeInvoice
      }
    }
  }
  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  ${InvoiceInfosForCustomerDraftInvoicesListFragmentDoc}
  ${InvoiceInfosForInvoiceListFragmentDoc}
  ${InvoiceForFinalizeInvoiceFragmentDoc}
`

interface CustomerInvoicesListProps {
  customerId: string
  customerTimezone: TimezoneEnum
}

export const CustomerInvoicesList = ({
  customerId,
  customerTimezone,
}: CustomerInvoicesListProps) => {
  const { translate } = useInternationalization()
  const {
    data: dataDraft,
    error: errorDraft,
    loading: loadingDraft,
  } = useGetCustomerInvoicesQuery({
    variables: {
      customerId,
      limit: DRAFT_INVOICES_ITEMS_COUNT,
      status: InvoiceStatusTypeEnum.Draft,
    },
  })
  const {
    data: dataFinalized,
    error: errorFinalized,
    fetchMore: fetchMoreFinalized,
    loading: loadingFinalized,
  } = useGetCustomerInvoicesQuery({
    variables: { customerId, limit: 20, status: InvoiceStatusTypeEnum.Finalized },
  })
  const initialLoad = loadingDraft && loadingFinalized
  const invoicesDraft = dataDraft?.customerInvoices.collection
  const invoicesFinalized = dataFinalized?.customerInvoices.collection

  if (errorDraft || errorFinalized) {
    return (
      <GenericPlaceholder
        title={translate('text_634812d6f16b31ce5cbf4111')}
        subtitle={translate('text_634812d6f16b31ce5cbf411f')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
        buttonVariant="primary"
        buttonAction={location.reload}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      {initialLoad ? (
        <InvoicesList
          customerId={customerId}
          loadingItemCount={4}
          customerTimezone={customerTimezone}
          loading
        />
      ) : (
        <>
          {!invoicesDraft?.length && !invoicesFinalized?.length ? (
            <EmptyTitle>{translate('text_6250304370f0f700a8fdc293')}</EmptyTitle>
          ) : (
            <>
              {!!invoicesDraft?.length && (
                <InvoicesList
                  customerTimezone={customerTimezone}
                  customerId={customerId}
                  invoices={invoicesDraft}
                  label={translate('text_638f4d756d899445f18a49ee')}
                  loading={loadingDraft}
                  itemDisplayLimit={DRAFT_INVOICES_ITEMS_COUNT}
                  metadata={dataDraft?.customerInvoices.metadata}
                />
              )}
              {!!invoicesFinalized?.length && (
                <InvoicesList
                  customerTimezone={customerTimezone}
                  customerId={customerId}
                  fetchMore={fetchMoreFinalized}
                  invoices={invoicesFinalized}
                  label={translate('text_6250304370f0f700a8fdc291')}
                  loading={loadingFinalized}
                  metadata={dataFinalized?.customerInvoices.metadata}
                  showPaymentCell
                />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

const EmptyTitle = styled(Typography)`
  margin-top: ${theme.spacing(6)};
`
