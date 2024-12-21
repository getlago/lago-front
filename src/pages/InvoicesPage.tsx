import { gql } from '@apollo/client'
import { useMemo, useRef } from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import CreditNotesTable from '~/components/creditNote/CreditNotesTable'
import { Button, NavigationTab, Typography } from '~/components/designSystem'
import {
  formatFiltersForCreditNotesQuery,
  formatFiltersForInvoiceQuery,
  isOutstandingUrlParams,
} from '~/components/designSystem/Filters/utils'
import { ExportDialog, ExportDialogRef, ExportValues } from '~/components/exports/ExportDialog'
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
  CreditNoteExportTypeEnum,
  CreditNotesForTableFragmentDoc,
  CreditNoteTableItemFragmentDoc,
  InvoiceExportTypeEnum,
  InvoiceListItemFragmentDoc,
  LagoApiError,
  useCreateCreditNotesDataExportMutation,
  useCreateInvoicesDataExportMutation,
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
    $currency: CurrencyEnum
    $customerExternalId: String
    $invoiceType: [InvoiceTypeEnum!]
    $issuingDateFrom: ISO8601Date
    $issuingDateTo: ISO8601Date
    $limit: Int
    $page: Int
    $paymentDisputeLost: Boolean
    $paymentOverdue: Boolean
    $paymentStatus: [InvoicePaymentStatusTypeEnum!]
    $searchTerm: String
    $status: [InvoiceStatusTypeEnum!]
  ) {
    invoices(
      currency: $currency
      customerExternalId: $customerExternalId
      invoiceType: $invoiceType
      issuingDateFrom: $issuingDateFrom
      issuingDateTo: $issuingDateTo
      limit: $limit
      page: $page
      paymentDisputeLost: $paymentDisputeLost
      paymentOverdue: $paymentOverdue
      paymentStatus: $paymentStatus
      searchTerm: $searchTerm
      status: $status
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
      ...CreditNotesForTable
    }
  }

  mutation retryAllInvoicePayments($input: RetryAllInvoicePaymentsInput!) {
    retryAllInvoicePayments(input: $input) {
      metadata {
        totalCount
      }
    }
  }

  mutation createInvoicesDataExport($input: CreateDataExportsInvoicesInput!) {
    createInvoicesDataExport(input: $input) {
      id
    }
  }

  mutation createCreditNotesDataExport($input: CreateDataExportsCreditNotesInput!) {
    createCreditNotesDataExport(input: $input) {
      id
    }
  }

  ${InvoiceListItemFragmentDoc}
  ${CreditNoteTableItemFragmentDoc}
  ${CreditNotesForTableFragmentDoc}
`

enum InvoiceListTabEnum {
  'invoices' = 'invoices',
  'creditNotes' = 'creditNotes',
}

const InvoicesPage = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { tab = InvoiceListTabEnum.invoices } = useParams<{ tab?: InvoiceListTabEnum }>()
  const [searchParams] = useSearchParams()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const exportInvoicesDialogRef = useRef<ExportDialogRef>(null)
  const exportCreditNotesDialogRef = useRef<ExportDialogRef>(null)

  const filtersForInvoiceQuery = useMemo(() => {
    return formatFiltersForInvoiceQuery(searchParams)
  }, [searchParams])

  const filtersForCreditNotesQuery = useMemo(() => {
    return formatFiltersForCreditNotesQuery(searchParams)
  }, [searchParams])

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
      ...filtersForInvoiceQuery,
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
      ...filtersForCreditNotesQuery,
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

  const onInvoicesExport = async (values: ExportValues<InvoiceExportTypeEnum>) => {
    const filters = {
      ...formatFiltersForInvoiceQuery(searchParams),
      searchTerm: variableInvoices?.searchTerm,
    }

    const res = await triggerCreateInvoicesDataExport({
      variables: {
        input: {
          ...values,
          filters,
        },
      },
    })

    if (res.errors) return
  }

  const onCreditNotesExport = async (values: ExportValues<CreditNoteExportTypeEnum>) => {
    const filters = {
      ...formatFiltersForCreditNotesQuery(searchParams),
      searchTerm: variableInvoices?.searchTerm,
    }

    const res = await triggerCreateCreditNotesDataExport({
      variables: {
        input: {
          ...values,
          filters,
        },
      },
    })

    if (res.errors) return
  }

  const [triggerCreateInvoicesDataExport] = useCreateInvoicesDataExportMutation({
    onCompleted({ createInvoicesDataExport }) {
      if (createInvoicesDataExport) {
        addToast({
          message: translate('text_66b323b63e76c400f78cd342'),
          severity: 'info',
        })
      }
    },
  })

  const [triggerCreateCreditNotesDataExport] = useCreateCreditNotesDataExportMutation({
    onCompleted({ createCreditNotesDataExport }) {
      if (createCreditNotesDataExport) {
        addToast({
          message: translate('text_66b323b63e76c400f78cd342'),
          severity: 'info',
        })
      }
    },
  })

  const invoicesTotalCount = dataInvoices?.invoices?.metadata?.totalCount
  const creditNotesTotalCount = dataCreditNotes?.creditNotes?.metadata?.totalCount

  return (
    <>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63ac86d797f728a87b2f9f85')}
        </Typography>

        <HeaderRigthBlock>
          {tab === InvoiceListTabEnum.invoices ? (
            <>
              <SearchInput
                onChange={invoiceDebounceSearch}
                placeholder={translate('text_63c68131568d582a38233e84')}
              />
              <Button
                variant="secondary"
                disabled={!dataInvoices?.invoices?.metadata?.totalCount}
                onClick={exportInvoicesDialogRef.current?.openDialog}
              >
                {translate('text_66b21236c939426d07ff98ca')}
              </Button>
            </>
          ) : tab === InvoiceListTabEnum.creditNotes ? (
            <>
              <SearchInput
                onChange={creditNoteDebounceSearch}
                placeholder={translate('text_63c6edd80c57d0dfaae3898e')}
              />
              <Button
                variant="secondary"
                disabled={!dataCreditNotes?.creditNotes?.metadata.totalCount}
                onClick={exportCreditNotesDialogRef.current?.openDialog}
              >
                {translate('text_66b21236c939426d07ff98ca')}
              </Button>
            </>
          ) : null}

          {isOutstandingUrlParams(searchParams) && hasPermissions(['invoicesSend']) && (
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
        className="px-4 md:px-12"
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
              <CreditNotesTable
                creditNotes={dataCreditNotes?.creditNotes?.collection}
                error={errorCreditNotes}
                fetchMore={fetchMoreCreditNotes}
                isLoading={creditNoteIsLoading}
                metadata={dataCreditNotes?.creditNotes?.metadata}
                variables={variableCreditNotes}
                tableContainerSize={{
                  default: 16,
                  md: 48,
                }}
              />
            ),
            hidden: !hasPermissions(['creditNotesView']),
          },
        ]}
      />

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />

      <ExportDialog
        ref={exportInvoicesDialogRef}
        totalCountLabel={translate(
          'text_66b21236c939426d07ff9937',
          { invoicesTotalCount },
          invoicesTotalCount,
        )}
        onExport={onInvoicesExport}
        disableExport={invoicesTotalCount === 0}
        resourceTypeOptions={[
          {
            label: translate('text_66b21236c939426d07ff993b'),
            sublabel: translate('text_66b21236c939426d07ff993c'),
            value: InvoiceExportTypeEnum.Invoices,
          },
          {
            label: translate('text_66b21236c939426d07ff993d'),
            sublabel: translate('text_66b21236c939426d07ff993e'),
            value: InvoiceExportTypeEnum.InvoiceFees,
          },
        ]}
      />

      <ExportDialog
        ref={exportCreditNotesDialogRef}
        totalCountLabel={translate(
          'text_17346987416277yx1mf6nau2',
          { creditNotesTotalCount },
          creditNotesTotalCount,
        )}
        onExport={onCreditNotesExport}
        disableExport={creditNotesTotalCount === 0}
        resourceTypeOptions={[
          {
            label: translate('text_1734698741627bges5xz01la'),
            sublabel: translate('text_173469874162761dxr57rvw7'),
            value: CreditNoteExportTypeEnum.CreditNotes,
          },
          {
            label: translate('text_1734698741627449t5wdghef'),
            sublabel: translate('text_1734698875217ppgrrmd10q2'),
            value: CreditNoteExportTypeEnum.CreditNoteItems,
          },
        ]}
      />
    </>
  )
}

export default InvoicesPage

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`
