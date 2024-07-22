import { gql } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, NavigationTab, Typography } from '~/components/designSystem'
import CreditNotesList from '~/components/invoices/CreditNotesList'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import InvoicesList from '~/components/invoices/InvoicesList'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { SearchInput } from '~/components/SearchInput'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { INVOICES_ROUTE, INVOICES_TAB_ROUTE } from '~/core/router'
import {
  CreditNoteForCreditNoteListFragmentDoc,
  CreditNoteForCreditNoteListItemFragmentDoc,
  InvoiceListItemFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  LagoApiError,
  useGetCreditNotesListLazyQuery,
  useGetInvoicesListLazyQuery,
  useRetryAllInvoicePaymentsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader, theme } from '~/styles'

gql`
  query getInvoicesList(
    $limit: Int
    $page: Int
    $status: [InvoiceStatusTypeEnum!]
    $paymentStatus: [InvoicePaymentStatusTypeEnum!]
    $searchTerm: String
    $paymentDisputeLost: Boolean
    $paymentOverdue: Boolean
  ) {
    invoices(
      limit: $limit
      page: $page
      status: $status
      paymentStatus: $paymentStatus
      searchTerm: $searchTerm
      paymentDisputeLost: $paymentDisputeLost
      paymentOverdue: $paymentOverdue
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

  query getCreditNotesList($limit: Int, $page: Int, $searchTerm: String) {
    creditNotes(limit: $limit, page: $page, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...CreditNoteForCreditNoteList
        ...CreditNoteForCreditNoteListItem
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
  ${CreditNoteForCreditNoteListFragmentDoc}
  ${CreditNoteForCreditNoteListItemFragmentDoc}
`

export enum InvoiceListStatusEnum {
  'all' = 'all',
  'draft' = 'draft',
  'outstanding' = 'outstanding',
  'succeeded' = 'succeeded',
  'voided' = 'voided',
  'disputed' = 'disputed',
  'overdue' = 'overdue',
}

enum InvoiceListTabEnum {
  'invoices' = 'invoices',
  'creditNotes' = 'creditNotes',
}

const InvoicesPage = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { tab = InvoiceListTabEnum.invoices } = useParams<{ tab?: InvoiceListTabEnum }>()
  let [searchParams, setSearchParams] = useSearchParams({
    invoiceType: tab === InvoiceListTabEnum.invoices ? InvoiceListStatusEnum.all : '',
  })
  const urlInvoiceType = searchParams.get('invoiceType') || ''
  const [invoiceType, setInvoiceType] = useState<InvoiceListStatusEnum>(
    (urlInvoiceType as InvoiceListStatusEnum) || InvoiceListStatusEnum.all,
  )
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)

  const [
    getInvoices,
    {
      data: dataInvoices,
      loading: loadingInvoices,
      error: errorInvoices,
      fetchMore: fetchMoreInvoices,
      variables: variableInvoices,
    },
  ] = useGetInvoicesListLazyQuery({
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    variables: {
      limit: 20,
      ...(invoiceType === InvoiceListStatusEnum.draft && { status: InvoiceStatusTypeEnum.Draft }),
      ...(invoiceType === InvoiceListStatusEnum.voided && { status: InvoiceStatusTypeEnum.Voided }),
      ...(invoiceType === InvoiceListStatusEnum.outstanding && {
        status: [InvoiceStatusTypeEnum.Finalized],
        paymentStatus: [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending],
      }),
      ...(invoiceType === InvoiceListStatusEnum.succeeded && {
        paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
        status: [InvoiceStatusTypeEnum.Finalized],
      }),
      ...(invoiceType === InvoiceListStatusEnum.disputed && {
        paymentDisputeLost: true,
      }),
      ...(invoiceType === InvoiceListStatusEnum.overdue && {
        paymentOverdue: true,
      }),
    },
  })

  const [
    getCreditNotes,
    {
      data: dataCreditNotes,
      loading: loadingCreditNotes,
      error: errorCreditNotes,
      fetchMore: fetchMoreCreditNotes,
      variables: variableCreditNotes,
    },
  ] = useGetCreditNotesListLazyQuery({
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    variables: {
      limit: 20,
    },
  })

  const { debouncedSearch: invoiceDebounceSearch, isLoading: invoiceIsLoading } =
    useDebouncedSearch(getInvoices, loadingInvoices)
  const { debouncedSearch: creditNoteDebounceSearch, isLoading: creditNoteIsLoading } =
    useDebouncedSearch(getCreditNotes, loadingCreditNotes)

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
  const listContainerElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to top of list when switching tabs
    listContainerElementRef?.current?.scrollTo({ top: 0 })
  }, [tab])

  useEffect(() => {
    let localUrlInvoiceType = Object.keys(InvoiceListStatusEnum).includes(urlInvoiceType)
      ? urlInvoiceType
      : InvoiceListStatusEnum.all

    setInvoiceType(localUrlInvoiceType as InvoiceListStatusEnum)
  }, [urlInvoiceType])

  useEffect(() => {
    // If invoice page and no search params, set the default search param
    if (tab === InvoiceListTabEnum.invoices && !searchParams.get('invoiceType')) {
      setSearchParams({ invoiceType: InvoiceListStatusEnum.all })
    }
  }, [searchParams, setSearchParams, tab])

  return (
    <>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63ac86d797f728a87b2f9f85')}
        </Typography>

        <HeaderRigthBlock>
          {tab === InvoiceListTabEnum.invoices ? (
            <SearchInput
              onChange={invoiceDebounceSearch}
              placeholder={translate('text_63c68131568d582a38233e84')}
            />
          ) : tab === InvoiceListTabEnum.creditNotes ? (
            <SearchInput
              onChange={creditNoteDebounceSearch}
              placeholder={translate('text_63c6edd80c57d0dfaae3898e')}
            />
          ) : null}

          {invoiceType === InvoiceListStatusEnum.outstanding &&
            hasPermissions(['invoicesSend']) && (
              <Button
                disabled={!dataInvoices?.invoices?.metadata?.totalCount}
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
        leftPadding
        tabs={[
          {
            title: translate('text_63ac86d797f728a87b2f9f85'),
            link: generatePath(INVOICES_TAB_ROUTE, {
              tab: InvoiceListTabEnum.invoices,
            }),
            match: [
              INVOICES_ROUTE,
              generatePath(INVOICES_TAB_ROUTE, { tab: InvoiceListTabEnum.invoices }),
            ],
            component: (
              <InvoicesList
                error={errorInvoices}
                fetchMore={fetchMoreInvoices}
                invoices={dataInvoices?.invoices?.collection}
                invoiceType={invoiceType}
                isLoading={invoiceIsLoading}
                metadata={dataInvoices?.invoices?.metadata}
                variables={variableInvoices}
              />
            ),
            hidden: !hasPermissions(['invoicesView']),
          },
          {
            title: translate('text_636bdef6565341dcb9cfb125'),
            link: generatePath(INVOICES_TAB_ROUTE, {
              tab: InvoiceListTabEnum.creditNotes,
            }),
            component: (
              <CreditNotesList
                creditNotes={dataCreditNotes?.creditNotes?.collection}
                error={errorCreditNotes}
                fetchMore={fetchMoreCreditNotes}
                isLoading={creditNoteIsLoading}
                metadata={dataCreditNotes?.creditNotes?.metadata}
                variables={variableCreditNotes}
              />
            ),
            hidden: !hasPermissions(['creditNotesView']),
          },
        ]}
      />

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
    </>
  )
}

export default InvoicesPage

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`
