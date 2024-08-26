import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  InfiniteScroll,
  QuickFilters,
  Status,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE, INVOICE_SETTINGS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  GetInvoicesListQuery,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  LagoApiError,
  useDownloadInvoiceItemMutation,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { theme } from '~/styles'

import { Filters } from '../designSystem/Filters/Filters'
import { AvailableFiltersEnum, AvailableQuickFilters } from '../designSystem/Filters/types'
import {
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from '../designSystem/Filters/utils'

type TInvoiceListProps = {
  error: ApolloError | undefined
  fetchMore: Function
  invoices: GetInvoicesListQuery['invoices']['collection'] | undefined
  isLoading: boolean
  metadata: GetInvoicesListQuery['invoices']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
}

const InvoicesList = ({
  error,
  fetchMore,
  invoices,
  isLoading,
  metadata,
  variables,
}: TInvoiceListProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  let [searchParams] = useSearchParams()

  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)

  const [downloadInvoice] = useDownloadInvoiceItemMutation({
    onCompleted({ downloadInvoice: data }) {
      const fileUrl = data?.fileUrl

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

  const [retryCollect] = useRetryInvoicePaymentMutation({
    context: { silentErrorCodes: [LagoApiError.PaymentProcessorIsCurrentlyHandlingPayment] },
    onCompleted({ retryInvoicePayment }) {
      if (!!retryInvoicePayment?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_63ac86d897f728a87b2fa0b3',
        })
      }
    },
  })

  const listContainerElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to top of list when switching tabs
    listContainerElementRef?.current?.scrollTo({ top: 0 })
  }, [searchParams])

  return (
    <>
      <FiltersWrapper>
        <QuickFilters hideBorderBottom type={AvailableQuickFilters.InvoiceStatus} />
        <Filters
          filters={[
            AvailableFiltersEnum.status,
            AvailableFiltersEnum.invoiceType,
            AvailableFiltersEnum.paymentStatus,
            AvailableFiltersEnum.currency,
            AvailableFiltersEnum.issuingDate,
            AvailableFiltersEnum.customerExternalId,
            AvailableFiltersEnum.paymentDisputeLost,
            AvailableFiltersEnum.paymentOverdue,
          ]}
        />
      </FiltersWrapper>

      <div ref={listContainerElementRef}>
        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = metadata || {}

            currentPage < totalPages &&
              !isLoading &&
              fetchMore({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          <Table
            name="invoices-list"
            data={invoices || []}
            containerSize={{
              default: 16,
              md: 48,
            }}
            isLoading={isLoading}
            hasError={!!error}
            actionColumn={(invoice) => {
              const { status, paymentStatus, voidable } = invoice

              const canDownload =
                ![InvoiceStatusTypeEnum.Draft, InvoiceStatusTypeEnum.Failed].includes(status) &&
                hasPermissions(['invoicesView'])
              const canFinalize =
                ![InvoiceStatusTypeEnum.Failed].includes(status) &&
                hasPermissions(['invoicesUpdate'])
              const canRetryCollect =
                status === InvoiceStatusTypeEnum.Finalized &&
                [
                  InvoicePaymentStatusTypeEnum.Failed,
                  InvoicePaymentStatusTypeEnum.Pending,
                ].includes(paymentStatus) &&
                hasPermissions(['invoicesSend'])
              const canUpdatePaymentStatus =
                ![
                  InvoiceStatusTypeEnum.Draft,
                  InvoiceStatusTypeEnum.Voided,
                  InvoiceStatusTypeEnum.Failed,
                ].includes(status) && hasPermissions(['invoicesUpdate'])
              const canVoid =
                status === InvoiceStatusTypeEnum.Finalized &&
                [
                  InvoicePaymentStatusTypeEnum.Pending,
                  InvoicePaymentStatusTypeEnum.Failed,
                ].includes(paymentStatus) &&
                hasPermissions(['invoicesVoid'])

              return [
                canDownload
                  ? {
                      startIcon: 'download',
                      title: translate('text_62b31e1f6a5b8b1b745ece42'),
                      onAction: async ({ id }) => {
                        await downloadInvoice({
                          variables: { input: { id } },
                        })
                      },
                    }
                  : canFinalize
                    ? {
                        startIcon: 'checkmark',
                        title: translate('text_63a41a8eabb9ae67047c1c08'),
                        onAction: (item) => finalizeInvoiceRef.current?.openDialog(item),
                      }
                    : null,
                canRetryCollect
                  ? {
                      startIcon: 'push',
                      title: translate('text_63ac86d897f728a87b2fa039'),
                      onAction: async ({ id }) => {
                        const { errors } = await retryCollect({
                          variables: {
                            input: {
                              id,
                            },
                          },
                        })

                        if (
                          hasDefinedGQLError('PaymentProcessorIsCurrentlyHandlingPayment', errors)
                        ) {
                          addToast({
                            severity: 'danger',
                            translateKey: 'text_63b6d06df1a53b7e2ad973ad',
                          })
                        }
                      },
                    }
                  : null,
                {
                  startIcon: 'duplicate',
                  title: translate('text_63ac86d897f728a87b2fa031'),
                  onAction: ({ id }) => {
                    copyToClipboard(id)
                    addToast({
                      severity: 'info',
                      translateKey: 'text_63ac86d897f728a87b2fa0b0',
                    })
                  },
                },
                canUpdatePaymentStatus
                  ? {
                      startIcon: 'coin-dollar',
                      title: translate('text_63eba8c65a6c8043feee2a01'),
                      onAction: () => {
                        updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
                      },
                    }
                  : null,
                canVoid
                  ? {
                      startIcon: 'stop',
                      title: translate('text_65269b43d4d2b15dd929a259'),
                      disabled: !voidable,
                      onAction: (item) =>
                        voidInvoiceDialogRef?.current?.openDialog({ invoice: item }),
                      ...(!voidable && {
                        tooltip: translate('text_65269c2e471133226211fdd0'),
                      }),
                    }
                  : null,
              ]
            }}
            columns={[
              {
                key: 'status',
                title: translate('text_63ac86d797f728a87b2f9fa7'),
                minWidth: 80,
                content: ({ status, errorDetails }) => {
                  const showWarningIcon = !!errorDetails?.length

                  return (
                    <Tooltip
                      placement="top-start"
                      disableHoverListener={!showWarningIcon}
                      title={translate('text_1724674592260h33v56rycaw')}
                    >
                      <Status
                        {...invoiceStatusMapping({ status })}
                        endIcon={showWarningIcon ? 'warning-unfilled' : undefined}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                key: 'number',
                title: translate('text_63ac86d797f728a87b2f9fad'),
                minWidth: 160,
                content: ({ number }) => (
                  <Typography variant="body" noWrap>
                    {number}
                  </Typography>
                ),
              },
              {
                key: 'totalAmountCents',
                title: translate('text_63ac86d797f728a87b2f9fb9'),
                textAlign: 'right',
                minWidth: 160,
                content: ({ totalAmountCents, currency, status }) => {
                  return (
                    <Typography variant="bodyHl" color="textSecondary" noWrap>
                      {status === InvoiceStatusTypeEnum.Failed
                        ? '-'
                        : intlFormatNumber(
                            deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd),
                            {
                              currency: currency || CurrencyEnum.Usd,
                            },
                          )}
                    </Typography>
                  )
                },
              },
              {
                key: 'paymentStatus',
                title: translate('text_6419c64eace749372fc72b40'),
                minWidth: 80,
                content: ({ status, paymentStatus, paymentOverdue, paymentDisputeLostAt }) => {
                  if (status !== InvoiceStatusTypeEnum.Finalized) {
                    return null
                  }

                  return (
                    <Tooltip
                      placement="top"
                      title={
                        !!paymentDisputeLostAt
                          ? translate('text_172416478461328edo4vwz05')
                          : undefined
                      }
                    >
                      <Status
                        {...paymentStatusMapping({
                          status,
                          paymentStatus,
                          paymentOverdue,
                        })}
                        endIcon={!!paymentDisputeLostAt ? 'warning-unfilled' : undefined}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                key: 'customer.name',
                title: translate('text_65201c5a175a4b0238abf29a'),
                maxSpace: true,
                minWidth: 160,
                content: ({ customer }) => (
                  <Typography variant="body" noWrap>
                    {customer.name || '-'}
                  </Typography>
                ),
              },

              {
                key: 'issuingDate',
                title: translate('text_63ac86d797f728a87b2f9fbf'),
                minWidth: 104,
                content: ({ issuingDate, customer }) => (
                  <Typography variant="body" noWrap>
                    {formatDateToTZ(issuingDate, customer.applicableTimezone)}
                  </Typography>
                ),
              },
            ]}
            onRowAction={(invoice) => {
              navigate(
                generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                  customerId: invoice?.customer?.id,
                  invoiceId: invoice.id,
                  tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                }),
              )
            }}
            placeholder={{
              errorState: variables?.searchTerm
                ? {
                    title: translate('text_623b53fea66c76017eaebb6e'),
                    subtitle: translate('text_63bab307a61c62af497e0599'),
                  }
                : {
                    title: translate('text_63ac86d797f728a87b2f9fea'),
                    subtitle: translate('text_63ac86d797f728a87b2f9ff2'),
                    buttonTitle: translate('text_63ac86d797f728a87b2f9ffa'),
                    buttonAction: () => location.reload(),
                    buttonVariant: 'primary',
                  },
              emptyState: variables?.searchTerm
                ? {
                    title: translate(
                      isSucceededUrlParams(searchParams)
                        ? 'text_63c67d2913c20b8d7d05c44c'
                        : isDraftUrlParams(searchParams)
                          ? 'text_63c67d2913c20b8d7d05c442'
                          : isOutstandingUrlParams(searchParams)
                            ? 'text_63c67d8796db41749ada51ca'
                            : isVoidedUrlParams(searchParams)
                              ? 'text_65269cd46e7ec037a6823fd8'
                              : 'text_63c67d2913c20b8d7d05c43e',
                    ),
                    subtitle: translate('text_66ab48ea4ed9cd01084c60b8'),
                  }
                : {
                    title: translate(
                      isSucceededUrlParams(searchParams)
                        ? 'text_63b578e959c1366df5d14559'
                        : isDraftUrlParams(searchParams)
                          ? 'text_63b578e959c1366df5d1455b'
                          : isOutstandingUrlParams(searchParams)
                            ? 'text_63b578e959c1366df5d1456e'
                            : isVoidedUrlParams(searchParams)
                              ? 'text_65269cd46e7ec037a6823fd6'
                              : isPaymentDisputeLostUrlParams(searchParams)
                                ? 'text_66141e30699a0631f0b2ec7f'
                                : isPaymentOverdueUrlParams(searchParams)
                                  ? 'text_666c5b12fea4aa1e1b26bf70'
                                  : 'text_63b578e959c1366df5d14569',
                    ),
                    subtitle: isSucceededUrlParams(searchParams) ? (
                      translate('text_63b578e959c1366df5d1455f')
                    ) : isDraftUrlParams(searchParams) ? (
                      <Typography
                        html={translate('text_63b578e959c1366df5d14566', {
                          link: INVOICE_SETTINGS_ROUTE,
                        })}
                      />
                    ) : isOutstandingUrlParams(searchParams) ? (
                      translate('text_63b578e959c1366df5d14570')
                    ) : isVoidedUrlParams(searchParams) ? (
                      translate('text_65269cd46e7ec037a6823fda')
                    ) : isPaymentDisputeLostUrlParams(searchParams) ? (
                      translate('text_66141e30699a0631f0b2ec87')
                    ) : isPaymentOverdueUrlParams(searchParams) ? (
                      <Typography
                        html={translate('text_666c5b12fea4aa1e1b26bf73', {
                          link: INVOICE_SETTINGS_ROUTE,
                        })}
                      />
                    ) : (
                      translate('text_63b578e959c1366df5d1456d')
                    ),
                  },
            }}
          />
        </InfiniteScroll>
      </div>

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
    </>
  )
}

export default InvoicesList

const FiltersWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
  box-sizing: border-box;
  gap: ${theme.spacing(3)};

  > *:first-child {
    padding-bottom: 0;
  }

  > *:last-child {
    padding-top: 0;
  }
`
