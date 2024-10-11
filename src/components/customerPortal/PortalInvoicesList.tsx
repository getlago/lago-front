import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useEffect } from 'react'

import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderInvoicesListTotal } from '~/components/customerPortal/common/SectionLoading'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import {
  Button,
  Icon,
  Status,
  StatusProps,
  StatusType,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
  PortalInvoiceListItemFragmentDoc,
  useCustomerPortalInvoicesLazyQuery,
  useDownloadCustomerPortalInvoiceMutation,
  useGetCustomerPortalInvoicesCollectionLazyQuery,
  useGetCustomerPortalOverdueBalancesLazyQuery,
  useGetCustomerPortalUserCurrencyQuery,
} from '~/generated/graphql'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

gql`
  fragment PortalInvoiceListItem on Invoice {
    id
    paymentStatus
    paymentOverdue
    paymentDisputeLostAt
    number
    issuingDate
    totalAmountCents
    currency
    invoiceType
  }

  query customerPortalInvoices(
    $limit: Int
    $page: Int
    $searchTerm: String
    $status: [InvoiceStatusTypeEnum!]
  ) {
    customerPortalInvoices(limit: $limit, page: $page, searchTerm: $searchTerm, status: $status) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...PortalInvoiceListItem
      }
    }
  }

  mutation downloadCustomerPortalInvoice($input: DownloadCustomerPortalInvoiceInput!) {
    downloadCustomerPortalInvoice(input: $input) {
      id
      fileUrl
    }
  }

  query getCustomerPortalInvoicesCollection($expireCache: Boolean) {
    customerPortalInvoiceCollections(expireCache: $expireCache) {
      collection {
        amountCents
        invoicesCount
        currency
      }
    }
  }

  query getCustomerPortalOverdueBalances($expireCache: Boolean) {
    customerPortalOverdueBalances(expireCache: $expireCache) {
      collection {
        amountCents
        currency
        lagoInvoiceIds
      }
    }
  }

  query getCustomerPortalUserCurrency {
    customerPortalUser {
      currency
    }
  }

  ${PortalInvoiceListItemFragmentDoc}
  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
`
const INVOICE_TYPE_TRANSLATION_MAP: Record<InvoiceTypeEnum, string> = {
  [InvoiceTypeEnum.AddOn]: 'text_1728472697691t126b808cm9',
  [InvoiceTypeEnum.Credit]: 'text_1728472697691x8zhuzkp74r',
  [InvoiceTypeEnum.OneOff]: 'text_1728472697691t126b808cm9',
  [InvoiceTypeEnum.Subscription]: 'text_1728472697691k6k2e9m5ibb',
  [InvoiceTypeEnum.AdvanceCharges]: 'text_1728472697691y39tdxgyrcg',
  [InvoiceTypeEnum.ProgressiveBilling]: 'text_1728472697691pv1eqroobte',
}

interface CalculatedData {
  amount: number
  count: number
  currency?: CurrencyEnum
}

const mapStatusConfig = ({
  paymentStatus,
  paymentOverdue,
  paymentDisputeLostAt,
}: {
  paymentStatus: InvoicePaymentStatusTypeEnum
  paymentOverdue: boolean
  paymentDisputeLostAt: string | null
}): StatusProps => {
  if (paymentOverdue) {
    return { label: 'overdue', type: StatusType.danger }
  }

  if (paymentStatus === InvoicePaymentStatusTypeEnum.Succeeded) {
    return { label: 'pay', type: StatusType.success }
  }

  if (!!paymentDisputeLostAt) {
    return { label: 'disputed', type: StatusType.danger }
  }

  return { label: 'toPay', type: StatusType.default }
}

const PortalInvoicesList = () => {
  const { translate, documentLocale } = useCustomerPortalTranslate()

  const [getInvoices, { data, loading, error, fetchMore, variables, refetch }] =
    useCustomerPortalInvoicesLazyQuery({
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: {
        limit: 8,
        status: [InvoiceStatusTypeEnum.Finalized],
      },
    })

  const { data: userCurrencyData } = useGetCustomerPortalUserCurrencyQuery()
  const [getOverdueBalance, { data: overdueData, loading: overdueLoading, error: overdueError }] =
    useGetCustomerPortalOverdueBalancesLazyQuery()
  const [
    getInvoicesCollection,
    { data: invoicesData, loading: invoicesLoading, error: invoicesError },
  ] = useGetCustomerPortalInvoicesCollectionLazyQuery()

  useEffect(() => {
    getOverdueBalance()
    getInvoicesCollection()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const customerCurrency = userCurrencyData?.customerPortalUser?.currency ?? CurrencyEnum.Usd

  const overdue = (
    overdueData?.customerPortalOverdueBalances?.collection || []
  ).reduce<CalculatedData>(
    (acc, item) => {
      return {
        amount: acc.amount + deserializeAmount(item.amountCents, item.currency),
        count: acc.count + item.lagoInvoiceIds.length,
        currency: item.currency,
      }
    },
    { amount: 0, count: 0, currency: customerCurrency },
  )

  const invoices = (
    invoicesData?.customerPortalInvoiceCollections?.collection || []
  ).reduce<CalculatedData>(
    (acc, item) => {
      return {
        amount: acc.amount + deserializeAmount(item.amountCents, item.currency ?? customerCurrency),
        count: acc.count + Number(item.invoicesCount),
        currency: item.currency ?? acc.currency,
      }
    },
    { amount: 0, count: 0, currency: customerCurrency },
  )

  const [downloadInvoice] = useDownloadCustomerPortalInvoiceMutation({
    onCompleted(localData) {
      const fileUrl = localData?.downloadCustomerPortalInvoice?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
      } else {
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

  const { debouncedSearch, isLoading: searchIsLoading } = useDebouncedSearch(getInvoices, loading)
  const { metadata, collection } = data?.customerPortalInvoices || {}
  const hasSearchTerm = !!variables?.searchTerm
  const hasNoInvoices = !loading && !error && !metadata?.totalCount && !hasSearchTerm

  const { currentPage = 0, totalPages = 0 } = metadata || {}

  if (error) {
    return (
      <section>
        <SectionTitle title={translate('text_6419c64eace749372fc72b37')} />

        <SectionError refresh={() => refetch()} />
      </section>
    )
  }

  return (
    <div>
      <SectionTitle title={translate('text_6419c64eace749372fc72b37')} loading={loading} />

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-1">
          {invoicesLoading && <LoaderInvoicesListTotal />}

          {!invoicesLoading && !invoicesError && (
            <>
              <Typography className="text-sm font-normal text-grey-600">
                {translate('text_6670a7222702d70114cc7957')}
              </Typography>

              <Typography className="text-2xl font-semibold text-grey-700">
                {intlFormatNumber(invoices.amount, {
                  currency: invoices.currency,
                  locale: documentLocale,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Typography>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {overdueLoading && <LoaderInvoicesListTotal />}

          {!overdueLoading && !overdueError && (
            <>
              <Typography className="flex items-center gap-2 text-sm font-normal text-grey-600">
                {translate('text_6670a7222702d70114cc795a')}

                <Tooltip placement="top-start" title={translate('text_6670a757999f8a007789bb5d')}>
                  <Icon size="medium" name="info-circle" />
                </Tooltip>
              </Typography>

              <Typography className="text-2xl font-semibold text-grey-700">
                {intlFormatNumber(overdue.amount, {
                  currency: overdue.currency,
                  locale: documentLocale,
                  currencyDisplay: 'narrowSymbol',
                })}
              </Typography>
            </>
          )}
        </div>
      </div>

      <SearchInput
        className="mb-4 mt-6 w-full max-w-full"
        onChange={debouncedSearch}
        placeholder={translate('text_1728382674210n9qpjbnooi4')}
      />

      {!hasNoInvoices && (
        <>
          <Table
            name="portal-invoice"
            containerSize={{
              default: 0,
            }}
            isLoading={loading || searchIsLoading}
            hasError={!!error}
            placeholder={{
              errorState: {
                title: translate('text_641d6ae1d947c400671e6abb'),
                subtitle: translate('text_641d6aee014c8d00c1425cdd'),
                buttonTitle: translate('text_641d6b00ef96c1008754734d'),
                buttonAction: () => location.reload(),
              },
              emptyState: {
                title: translate('text_641d6b0c5a725b00af12bd76'),
                subtitle: translate('text_641d6b1ae9019c00b59fe250'),
              },
            }}
            data={collection ?? []}
            columns={[
              {
                key: 'issuingDate',
                title: translate('text_6419c64eace749372fc72b39'),
                minWidth: 104,
                content: ({ issuingDate }) => (
                  <Typography variant="body" noWrap>
                    {DateTime.fromISO(issuingDate).toLocaleString(DateTime.DATE_MED, {
                      locale: documentLocale,
                    })}
                  </Typography>
                ),
              },
              {
                key: 'invoiceType',
                title: translate('text_1728472381019nimbf36pk6t'),
                content: ({ invoiceType }) => (
                  <Typography variant="body" noWrap>
                    {translate(INVOICE_TYPE_TRANSLATION_MAP[invoiceType as InvoiceTypeEnum])}
                  </Typography>
                ),
              },
              {
                key: 'number',
                title: translate('text_6419c64eace749372fc72b3c'),
                maxSpace: true,
                minWidth: 160,
                content: ({ number }) => (
                  <Typography variant="body" noWrap>
                    {number}
                  </Typography>
                ),
              },
              {
                key: 'totalAmountCents',
                title: translate('text_6419c64eace749372fc72b3e'),
                textAlign: 'right',
                minWidth: 160,
                content: ({ totalAmountCents, currency }) => (
                  <Typography variant="bodyHl" color="textSecondary">
                    {intlFormatNumber(
                      deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd),
                      {
                        currency: currency || CurrencyEnum.Usd,
                        locale: documentLocale,
                        currencyDisplay: 'narrowSymbol',
                      },
                    )}
                  </Typography>
                ),
              },
              {
                key: 'paymentStatus',
                title: translate('text_6419c64eace749372fc72b40'),
                minWidth: 80,
                content: ({ paymentStatus, paymentOverdue, paymentDisputeLostAt }) => {
                  return (
                    <Status
                      {...mapStatusConfig({
                        paymentStatus,
                        paymentOverdue,
                        paymentDisputeLostAt,
                      })}
                      locale={documentLocale}
                    />
                  )
                },
              },
            ]}
            actionColumn={({ id }) => {
              return (
                <Tooltip
                  placement="top-end"
                  title={!searchIsLoading && translate('text_6419c64eace749372fc72b62')}
                >
                  <Button
                    icon="download"
                    variant="quaternary"
                    onClick={async () => await downloadInvoice({ variables: { input: { id } } })}
                    disabled={searchIsLoading}
                  />
                </Tooltip>
              )
            }}
          />

          {currentPage < totalPages && (
            <Button
              className="mt-2"
              variant="quaternary"
              startIcon="chevron-down"
              onClick={() =>
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
              }
            >
              <Typography className="text-base font-medium text-grey-600">
                {translate('text_62da6ec24a8e24e44f8128aa')}
              </Typography>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default PortalInvoicesList
