import { useRef, useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, NavigationTab, InfiniteScroll /* Button */ } from '~/components/designSystem'
import {
  INVOICES_TAB_ROUTE,
  INVOICES_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
} from '~/core/router'
import {
  useInvoicesListQuery,
  InvoiceStatusTypeEnum,
  InvoicePaymentStatusTypeEnum,
  InvoiceListItemFragmentDoc,
  // useRetryAllInvoicePaymentsMutation,
  // LagoApiError,
} from '~/generated/graphql'
import { theme, PageHeader, ListHeader, ListContainer, NAV_HEIGHT } from '~/styles'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
// import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  InvoiceListItemSkeleton,
  InvoiceListItem,
  InvoiceListItemGridTemplate,
  InvoiceListItemContextEnum,
} from '~/components/invoices/InvoiceListItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'

gql`
  query invoicesList(
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
    $paymentStatus: [InvoicePaymentStatusTypeEnum!]
  ) {
    invoices(limit: $limit, page: $page, status: $status, paymentStatus: $paymentStatus) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...InvoiceListItem
      }
    }
  }

  mutation retryAllInvoicePayments($input: RetryAllInvoicePaymentsInput!) {
    retryAllInvoicePayments(input: $input) {
      collection {
        id
      }
    }
  }

  ${InvoiceListItemFragmentDoc}
`

export enum InvoiceListTabEnum {
  'all' = 'all',
  'draft' = 'draft',
  'pendingFailed' = 'pendingFailed',
  'succeeded' = 'succeeded',
}

// Needed to be able to pass both ids to the keyboard navigation function
const ID_SPLIT_KEY = '&-%-&'
const NAVIGATION_KEY_BASE = 'invoice-item-'

const InvoicesList = () => {
  const { tab } = useParams<{ tab?: InvoiceListTabEnum }>()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { data, loading, error, fetchMore } = useInvoicesListQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: 20,
      ...(tab === InvoiceListTabEnum.draft && { status: InvoiceStatusTypeEnum.Draft }),
      ...(tab === InvoiceListTabEnum.pendingFailed && {
        status: InvoiceStatusTypeEnum.Finalized,
        paymentStatus: [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending],
      }),
      ...(tab === InvoiceListTabEnum.succeeded && {
        paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
        status: InvoiceStatusTypeEnum.Finalized,
      }),
    },
  })
  // const [retryAll] = useRetryAllInvoicePaymentsMutation({
  //   context: { silentErrorCodes: [LagoApiError.PaymentProcessorIsCurrentlyHandlingPayment] },
  //   onCompleted({ retryAllInvoicePayments }) {
  //     if (retryAllInvoicePayments) {
  //       addToast({
  //         severity: 'success',
  //         translateKey: 'text_63ac86d897f728a87b2fa0a7',
  //       })
  //     }
  //   },
  // })
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${NAVIGATION_KEY_BASE}${i}`,
    navigate: (id) => {
      const splitted = String(id).split(ID_SPLIT_KEY)

      navigate(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          id: splitted[0],
          invoiceId: splitted[1],
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        })
      )
    },
  })
  const listContainerElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to top of list when switching tabs
    listContainerElementRef?.current?.scrollTo({ top: 0 })
  }, [tab])
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63ac86d797f728a87b2f9f85')}
        </Typography>

        {/* TODO - re-able this button once backend fix has been done to avoid re-submitting
         {tab === InvoiceListTabEnum.pendingFailed && (
          <Button
            disabled={!data?.invoices?.metadata?.totalCount}
            onClick={async () => {
              const { errors } = await retryAll({ variables: { input: {} } })

              if (hasDefinedGQLError('PaymentProcessorIsCurrentlyHandlingPayment', errors)) {
                addToast({
                  severity: 'danger',
                  translateKey: 'text_63b6d06df1a53b7e2ad973ad',
                })
              }
            }}
          >
            {translate('text_63ac86d797f728a87b2f9fc4')}
          </Button>
        )} */}
      </PageHeader>
      <NavigationTab
        tabs={[
          {
            title: translate('text_63ac86d797f728a87b2f9f8b'),
            link: generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.all }),
            match: [
              INVOICES_ROUTE,
              generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.all }),
            ],
          },
          {
            title: translate('text_63ac86d797f728a87b2f9f91'),
            link: generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.draft }),
          },
          {
            title: translate('text_63ac86d797f728a87b2f9f97'),
            link: generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.pendingFailed }),
          },
          {
            title: translate('text_63ac86d797f728a87b2f9fa1'),
            link: generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.succeeded }),
          },
        ]}
      />
      {!!error ? (
        <GenericPlaceholder
          title={translate('text_63ac86d797f728a87b2f9fea')}
          subtitle={translate('text_63ac86d797f728a87b2f9ff2')}
          buttonTitle={translate('text_63ac86d797f728a87b2f9ffa')}
          buttonVariant="primary"
          buttonAction={location.reload}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : !loading && !data?.invoices?.collection?.length ? (
        <GenericPlaceholder
          title={translate(
            tab === InvoiceListTabEnum.succeeded
              ? 'text_63b578e959c1366df5d14559'
              : tab === InvoiceListTabEnum.draft
              ? 'text_63b578e959c1366df5d1455b'
              : tab === InvoiceListTabEnum.pendingFailed
              ? 'text_63b578e959c1366df5d1456e'
              : 'text_63b578e959c1366df5d14569'
          )}
          subtitle={
            tab === InvoiceListTabEnum.succeeded ? (
              translate('text_63b578e959c1366df5d1455f')
            ) : tab === InvoiceListTabEnum.draft ? (
              <Typography
                html={translate('text_63b578e959c1366df5d14566', { link: INVOICE_SETTINGS_ROUTE })}
              />
            ) : tab === InvoiceListTabEnum.pendingFailed ? (
              translate('text_63b578e959c1366df5d14570')
            ) : (
              translate('text_63b578e959c1366df5d1456d')
            )
          }
          image={<EmptyImage width="136" height="104" />}
        />
      ) : (
        <ScrollContainer ref={listContainerElementRef}>
          <List>
            <GridLine>
              <Typography variant="bodyHl" color="grey500">
                {translate('text_63ac86d797f728a87b2f9fa7')}
              </Typography>
              <Typography variant="bodyHl" color="grey500" noWrap>
                {translate('text_63ac86d797f728a87b2f9fad')}
              </Typography>
              <CustomerName variant="bodyHl" color="grey500" noWrap>
                {translate('text_63ac86d797f728a87b2f9fb3')}
              </CustomerName>
              <Typography variant="bodyHl" color="grey500" align="right">
                {translate('text_63ac86d797f728a87b2f9fb9')}
              </Typography>
              <Typography variant="bodyHl" color="grey500" align="right">
                {translate('text_63ac86d797f728a87b2f9fbf')}
              </Typography>
            </GridLine>
            <InfiniteScroll
              onBottom={() => {
                const { currentPage = 0, totalPages = 0 } = data?.invoices?.metadata || {}

                currentPage < totalPages &&
                  !loading &&
                  fetchMore({
                    variables: { page: currentPage + 1 },
                  })
              }}
            >
              {data?.invoices?.collection.map((invoice) => {
                index += 1

                return (
                  <InvoiceListItem
                    key={invoice.id}
                    context="organization"
                    invoice={invoice}
                    navigationProps={{
                      id: `${NAVIGATION_KEY_BASE}${index}`,
                      'data-id': `${invoice?.customer?.id}${ID_SPLIT_KEY}${invoice.id}`,
                    }}
                    to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                      id: invoice?.customer?.id,
                      invoiceId: invoice.id,
                      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                    })}
                  />
                )
              })}
              {loading &&
                [0, 1, 2].map((_, i) => (
                  <InvoiceListItemSkeleton
                    key={`invoice-item-skeleton-${i}`}
                    context="organization"
                  />
                ))}
            </InfiniteScroll>
          </List>
        </ScrollContainer>
      )}
    </div>
  )
}

export default InvoicesList

const ScrollContainer = styled.div`
  overflow: auto;
  height: calc(100vh - ${NAV_HEIGHT * 2}px);
`

const List = styled(ListContainer)`
  min-width: 740px;
  ${theme.breakpoints.down('md')} {
    min-width: 530px;
  }
`

const GridLine = styled(ListHeader)`
  ${InvoiceListItemGridTemplate(InvoiceListItemContextEnum.organization)}
  top: 0;
`

const CustomerName = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`
