import { gql } from '@apollo/client'
import { useMemo, useRef } from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router-dom'

import { Button, NavigationTab, Typography } from '~/components/designSystem'
import {
  formatFiltersForInvoiceQuery,
  isOutstandingUrlParams,
} from '~/components/designSystem/Filters'
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
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { SearchInput } from '~/components/SearchInput'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { INVOICE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { InvoiceListTabEnum } from '~/core/constants/tabsOptions'
import { INVOICES_ROUTE, INVOICES_TAB_ROUTE } from '~/core/router'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  InvoiceExportTypeEnum,
  InvoiceListItemFragmentDoc,
  LagoApiError,
  useCreateInvoicesDataExportMutation,
  useGetInvoicesListLazyQuery,
  useRetryAllInvoicePaymentsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader } from '~/styles'

gql`
  query getInvoicesList(
    $currency: CurrencyEnum
    $customerExternalId: String
    $invoiceType: [InvoiceTypeEnum!]
    $issuingDateFrom: ISO8601Date
    $issuingDateTo: ISO8601Date
    $limit: Int
    $page: Int
    $partiallyPaid: Boolean
    $paymentDisputeLost: Boolean
    $paymentOverdue: Boolean
    $paymentStatus: [InvoicePaymentStatusTypeEnum!]
    $searchTerm: String
    $status: [InvoiceStatusTypeEnum!]
    $amountFrom: Int
    $amountTo: Int
    $selfBilled: Boolean
    $billingEntityIds: [ID!]
  ) {
    invoices(
      currency: $currency
      customerExternalId: $customerExternalId
      invoiceType: $invoiceType
      issuingDateFrom: $issuingDateFrom
      issuingDateTo: $issuingDateTo
      limit: $limit
      page: $page
      partiallyPaid: $partiallyPaid
      paymentDisputeLost: $paymentDisputeLost
      paymentOverdue: $paymentOverdue
      paymentStatus: $paymentStatus
      searchTerm: $searchTerm
      status: $status
      amountFrom: $amountFrom
      amountTo: $amountTo
      selfBilled: $selfBilled
      billingEntityIds: $billingEntityIds
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

  ${InvoiceListItemFragmentDoc}
`

// TODO: This is a temporary workaround
const formatAmountCurrency = (
  filters: Record<string, string | string[] | boolean | number>,
  amountCurrency?: CurrencyEnum | null,
) => {
  const _filters = {
    ...filters,
  }

  if (_filters.amountFrom) {
    _filters.amountFrom = serializeAmount(
      Number(_filters.amountFrom),
      amountCurrency || CurrencyEnum.Usd,
    )
  }

  if (_filters.amountTo) {
    _filters.amountTo = serializeAmount(
      Number(_filters.amountTo),
      amountCurrency || CurrencyEnum.Usd,
    )
  }

  return _filters
}

const InvoicesPage = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { organization } = useOrganizationInfos()
  const [searchParams] = useSearchParams()
  const amountCurrency = organization?.defaultCurrency
  const { tab = InvoiceListTabEnum.invoices } = useParams<{ tab?: InvoiceListTabEnum }>()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const exportInvoicesDialogRef = useRef<ExportDialogRef>(null)

  const filtersForInvoiceQuery = useMemo(() => {
    return formatFiltersForInvoiceQuery(searchParams)
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
      ...formatAmountCurrency(filtersForInvoiceQuery, amountCurrency),
    },
  })

  const { debouncedSearch: invoiceDebounceSearch, isLoading: invoiceIsLoading } =
    useDebouncedSearch(getInvoices, loadingInvoices)

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
      ...formatAmountCurrency(formatFiltersForInvoiceQuery(searchParams), amountCurrency),
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

  const invoicesTotalCount = dataInvoices?.invoices?.metadata?.totalCount

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63ac86d797f728a87b2f9f85')}
        </Typography>

        <PageHeader.Group>
          {tab === InvoiceListTabEnum.invoices && (
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
          )}

          {isOutstandingUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX }) &&
            hasPermissions(['invoicesSend']) && (
              <Button
                disabled={!dataInvoices?.invoices?.metadata?.totalCount}
                onClick={async () => {
                  const { errors } = await retryAll({ variables: { input: {} } })

                  if (hasDefinedGQLError('PaymentProcessorIsCurrentlyHandlingPayment', errors)) {
                    addToast({
                      severity: 'info',
                      translateKey: 'text_63b6d06df1a53b7e2ad973ad',
                    })
                  }
                }}
              >
                {translate('text_63ac86d797f728a87b2f9fc4')}
              </Button>
            )}
        </PageHeader.Group>
      </PageHeader.Wrapper>
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
        ]}
      />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
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
    </>
  )
}

export default InvoicesPage
