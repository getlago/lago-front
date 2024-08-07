import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import styled, { css } from 'styled-components'

import {
  Button,
  InfiniteScroll,
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
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  PortalInvoiceListItemFragmentDoc,
  useCustomerPortalInvoicesLazyQuery,
  useDownloadCustomerPortalInvoiceMutation,
} from '~/generated/graphql'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { NAV_HEIGHT, theme } from '~/styles'

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

  ${PortalInvoiceListItemFragmentDoc}
  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
`

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

interface PortalCustomerInvoicesProps {
  translate: Function
  documentLocale: LocaleEnum
}

const PortalInvoicesList = ({ translate, documentLocale }: PortalCustomerInvoicesProps) => {
  const [getInvoices, { data, loading, error, fetchMore, variables }] =
    useCustomerPortalInvoicesLazyQuery({
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: {
        limit: 20,
        status: [InvoiceStatusTypeEnum.Finalized],
      },
    })

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

  const { debouncedSearch, isLoading } = useDebouncedSearch(getInvoices, loading)
  const { metadata, collection } = data?.customerPortalInvoices || {}
  const hasSearchTerm = !!variables?.searchTerm
  const hasNoInvoices = !loading && !error && !metadata?.totalCount && !hasSearchTerm

  return (
    <section>
      <PageHeader $isEmpty={hasNoInvoices}>
        <Typography variant="subhead" color="grey700">
          {translate('text_6419c64eace749372fc72b37')}
        </Typography>

        {!hasNoInvoices && (
          <HeaderRigthBlock>
            <SearchInput
              onChange={debouncedSearch}
              placeholder={translate('text_6419c64eace749372fc72b33')}
            />
          </HeaderRigthBlock>
        )}
      </PageHeader>
      {hasNoInvoices ? (
        <Typography>{translate('text_6419c64eace749372fc72b3b')}</Typography>
      ) : (
        <ScrollWrapper>
          <InfiniteScroll
            onBottom={() => {
              if (!fetchMore) return
              const { currentPage = 0, totalPages = 0 } = metadata || {}

              currentPage < totalPages &&
                !isLoading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            <Table
              name="portal-invoice"
              containerSize={{
                default: 0,
              }}
              isLoading={isLoading}
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
                    title={!isLoading && translate('text_6419c64eace749372fc72b62')}
                  >
                    <Button
                      icon="download"
                      variant="quaternary"
                      onClick={async () => await downloadInvoice({ variables: { input: { id } } })}
                      disabled={isLoading}
                    />
                  </Tooltip>
                )
              }}
            />
          </InfiniteScroll>
        </ScrollWrapper>
      )}
    </section>
  )
}

export default PortalInvoicesList

const PageHeader = styled.div<{ $isEmpty?: boolean }>`
  align-items: center;
  display: flex;
  height: ${NAV_HEIGHT}px;
  justify-content: space-between;
  ${({ $isEmpty }) =>
    !!$isEmpty &&
    css`
      box-shadow: ${theme.shadows[7]};
      margin-bottom: ${theme.spacing(6)};
    `};
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;
`

const ScrollWrapper = styled.div`
  overflow: auto;
  height: 100%;
`
