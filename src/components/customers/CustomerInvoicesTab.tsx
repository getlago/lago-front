import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesQuery,
  InvoiceForInvoiceListFragmentDoc,
} from '~/generated/graphql'
import { Typography, Skeleton } from '~/components/designSystem'
import { NAV_HEIGHT, theme } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'

import { CustomerInvoicesList } from './CustomerInvoicesList'

const DRAFT_INVOICES_ITEMS_COUNT = 4

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
  ) {
    customerInvoices(customerId: $customerId, limit: $limit, page: $page, status: $status) {
      ...InvoiceForInvoiceList
    }
  }

  ${InvoiceForInvoiceListFragmentDoc}
`

interface CustomerInvoicesTabProps {
  customerId: string
  customerTimezone: TimezoneEnum
}

export const CustomerInvoicesTab = ({ customerId, customerTimezone }: CustomerInvoicesTabProps) => {
  const navigate = useNavigate()
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
        <LoadingState>
          <Skeleton variant="text" width={224} height={12} marginBottom="30px" />
          <CustomerInvoicesList
            loading
            customerTimezone={customerTimezone}
            getOnClickLink={() => ''}
          />
        </LoadingState>
      ) : (
        <>
          {!invoicesDraft?.length && !invoicesFinalized?.length ? (
            <EmptyTitle>{translate('text_6250304370f0f700a8fdc293')}</EmptyTitle>
          ) : (
            <>
              {!!invoicesDraft?.length && (
                <div>
                  <Title variant="subhead" color="grey700">
                    {translate('text_638f4d756d899445f18a49ee')}
                  </Title>
                  <CustomerInvoicesList
                    loading={loadingDraft}
                    customerTimezone={customerTimezone}
                    getOnClickLink={(id) =>
                      generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                        id: customerId,
                        invoiceId: id,
                        tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                      })
                    }
                    invoiceData={dataDraft?.customerInvoices}
                    onSeeAll={() =>
                      navigate(generatePath(CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, { id: customerId }))
                    }
                  />
                </div>
              )}

              {!!invoicesFinalized?.length && (
                <div>
                  <Title variant="subhead" color="grey700">
                    {translate('text_6250304370f0f700a8fdc291')}
                  </Title>
                  <CustomerInvoicesList
                    loading={loadingFinalized}
                    customerTimezone={customerTimezone}
                    context="finalized"
                    invoiceData={dataFinalized?.customerInvoices}
                    getOnClickLink={(id) =>
                      generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                        id: customerId,
                        invoiceId: id,
                        tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                      })
                    }
                    fetchMore={fetchMoreFinalized}
                  />
                </div>
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

const LoadingState = styled.div`
  margin-top: 30px;
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
`
