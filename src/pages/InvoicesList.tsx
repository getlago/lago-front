import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, InfiniteScroll, NavigationTab, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import {
  InvoiceListItem,
  InvoiceListItemContextEnum,
  InvoiceListItemGridTemplate,
  InvoiceListItemSkeleton,
} from '~/components/invoices/InvoiceListItem'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { SearchInput } from '~/components/SearchInput'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  INVOICES_ROUTE,
  INVOICES_TAB_ROUTE,
} from '~/core/router'
import {
  InvoiceListItemFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  LagoApiError,
  useInvoicesListLazyQuery,
  useRetryAllInvoicePaymentsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, NAV_HEIGHT, PageHeader, theme } from '~/styles'

gql`
  query invoicesList(
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
    $paymentStatus: [InvoicePaymentStatusTypeEnum!]
    $searchTerm: String
  ) {
    invoices(
      limit: $limit
      page: $page
      status: $status
      paymentStatus: $paymentStatus
      searchTerm: $searchTerm
    ) {
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
  'voided' = 'voided',
}

// Needed to be able to pass both ids to the keyboard navigation function
const ID_SPLIT_KEY = '&-%-&'
const NAVIGATION_KEY_BASE = 'invoice-item-'

const InvoicesList = () => {
  const { tab } = useParams<{ tab?: InvoiceListTabEnum }>()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const [getInvoices, { data, loading, error, fetchMore, variables }] = useInvoicesListLazyQuery({
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    variables: {
      limit: 20,
      ...(tab === InvoiceListTabEnum.draft && { status: InvoiceStatusTypeEnum.Draft }),
      ...(tab === InvoiceListTabEnum.voided && { status: InvoiceStatusTypeEnum.Voided }),
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
  const { debouncedSearch, isLoading } = useDebouncedSearch(getInvoices, loading)
  const [retryAll] = useRetryAllInvoicePaymentsMutation({
    context: { silentErrorCodes: [LagoApiError.PaymentProcessorIsCurrentlyHandlingPayment] },
    onCompleted({ retryAllInvoicePayments }) {
      if (retryAllInvoicePayments) {
        addToast({
          severity: 'success',
          translateKey: 'text_63ac86d897f728a87b2fa0a7',
        })
      }
    },
  })
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${NAVIGATION_KEY_BASE}${i}`,
    navigate: (id) => {
      const splitted = String(id).split(ID_SPLIT_KEY)

      navigate(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: splitted[0],
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

        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63c68131568d582a38233e84')}
          />
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
          )}
        </HeaderRigthBlock>
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
          {
            title: translate('text_6376641a2a9c70fff5bddcd5'),
            link: generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.voided }),
          },
        ]}
      />
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
          {!!isLoading && variables?.searchTerm ? (
            <>
              {[0, 1, 2].map((i) => (
                <InvoiceListItemSkeleton
                  key={`invoice-item-skeleton-${i}`}
                  context="organization"
                />
              ))}
            </>
          ) : !isLoading && !!error ? (
            <>
              {!!variables?.searchTerm ? (
                <GenericPlaceholder
                  title={translate('text_623b53fea66c76017eaebb6e')}
                  subtitle={translate('text_63bab307a61c62af497e0599')}
                  image={<ErrorImage width="136" height="104" />}
                />
              ) : (
                <GenericPlaceholder
                  title={translate('text_63ac86d797f728a87b2f9fea')}
                  subtitle={translate('text_63ac86d797f728a87b2f9ff2')}
                  buttonTitle={translate('text_63ac86d797f728a87b2f9ffa')}
                  buttonVariant="primary"
                  buttonAction={() => location.reload()}
                  image={<ErrorImage width="136" height="104" />}
                />
              )}
            </>
          ) : !isLoading && !data?.invoices?.collection?.length ? (
            <>
              {!!variables?.searchTerm ? (
                <GenericPlaceholder
                  title={translate(
                    tab === InvoiceListTabEnum.succeeded
                      ? 'text_63c67d2913c20b8d7d05c44c'
                      : tab === InvoiceListTabEnum.draft
                      ? 'text_63c67d2913c20b8d7d05c442'
                      : tab === InvoiceListTabEnum.pendingFailed
                      ? 'text_63c67d8796db41749ada51ca'
                      : tab === InvoiceListTabEnum.voided
                      ? 'text_65269cd46e7ec037a6823fd8'
                      : 'text_63c67d2913c20b8d7d05c43e'
                  )}
                  subtitle={translate('text_63c67d2913c20b8d7d05c446')}
                  image={<EmptyImage width="136" height="104" />}
                />
              ) : (
                <GenericPlaceholder
                  title={translate(
                    tab === InvoiceListTabEnum.succeeded
                      ? 'text_63b578e959c1366df5d14559'
                      : tab === InvoiceListTabEnum.draft
                      ? 'text_63b578e959c1366df5d1455b'
                      : tab === InvoiceListTabEnum.pendingFailed
                      ? 'text_63b578e959c1366df5d1456e'
                      : tab === InvoiceListTabEnum.voided
                      ? 'text_65269cd46e7ec037a6823fd6'
                      : 'text_63b578e959c1366df5d14569'
                  )}
                  subtitle={
                    tab === InvoiceListTabEnum.succeeded ? (
                      translate('text_63b578e959c1366df5d1455f')
                    ) : tab === InvoiceListTabEnum.draft ? (
                      <Typography
                        html={translate('text_63b578e959c1366df5d14566', {
                          link: INVOICE_SETTINGS_ROUTE,
                        })}
                      />
                    ) : tab === InvoiceListTabEnum.pendingFailed ? (
                      translate('text_63b578e959c1366df5d14570')
                    ) : tab === InvoiceListTabEnum.voided ? (
                      translate('text_65269cd46e7ec037a6823fda')
                    ) : (
                      translate('text_63b578e959c1366df5d1456d')
                    )
                  }
                  image={<EmptyImage width="136" height="104" />}
                />
              )}
            </>
          ) : (
            <InfiniteScroll
              onBottom={() => {
                const { currentPage = 0, totalPages = 0 } = data?.invoices?.metadata || {}

                currentPage < totalPages &&
                  !isLoading &&
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
                      customerId: invoice?.customer?.id,
                      invoiceId: invoice.id,
                      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                    })}
                    finalizeInvoiceRef={finalizeInvoiceRef}
                    updateInvoicePaymentStatusDialog={updateInvoicePaymentStatusDialog}
                    voidInvoiceDialogRef={voidInvoiceDialogRef}
                  />
                )
              })}
              {isLoading &&
                [0, 1, 2].map((_, i) => (
                  <InvoiceListItemSkeleton
                    key={`invoice-item-skeleton-${i}`}
                    context="organization"
                  />
                ))}
            </InfiniteScroll>
          )}
        </List>
      </ScrollContainer>

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
    </div>
  )
}

export default InvoicesList

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

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
