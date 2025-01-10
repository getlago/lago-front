import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import {
  Chip,
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
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/NavigationEnum'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
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
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

import { createCreditNoteForInvoiceButtonProps } from '../creditNote/utils'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
  Filters,
  FiltersProvider,
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from '../designSystem/Filters'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '../PremiumWarningDialog'

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
  const { isPremium } = useCurrentUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const [downloadInvoice] = useDownloadInvoiceItemMutation({
    onCompleted({ downloadInvoice: data }) {
      handleDownloadFile(data?.fileUrl)
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
      <div className="box-border flex w-full flex-col gap-3 p-4 shadow-b md:px-12 md:py-3">
        <FiltersProvider
          availableFilters={[
            AvailableFiltersEnum.amount,
            AvailableFiltersEnum.status,
            AvailableFiltersEnum.invoiceType,
            AvailableFiltersEnum.paymentStatus,
            AvailableFiltersEnum.currency,
            AvailableFiltersEnum.issuingDate,
            AvailableFiltersEnum.customerExternalId,
            AvailableFiltersEnum.paymentDisputeLost,
            AvailableFiltersEnum.paymentOverdue,
          ]}
        >
          <QuickFilters type={AvailableQuickFilters.InvoiceStatus} />
          <Filters />
        </FiltersProvider>
      </div>

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

              const { disabledIssueCreditNoteButton, disabledIssueCreditNoteButtonLabel } =
                createCreditNoteForInvoiceButtonProps({
                  invoiceType: invoice?.invoiceType,
                  paymentStatus: invoice?.paymentStatus,
                  creditableAmountCents: invoice?.creditableAmountCents,
                  refundableAmountCents: invoice?.refundableAmountCents,
                  associatedActiveWalletPresent: invoice?.associatedActiveWalletPresent,
                })

              const canDownload =
                ![
                  InvoiceStatusTypeEnum.Draft,
                  InvoiceStatusTypeEnum.Failed,
                  InvoiceStatusTypeEnum.Pending,
                ].includes(status) && hasPermissions(['invoicesView'])
              const canFinalize =
                ![InvoiceStatusTypeEnum.Failed, InvoiceStatusTypeEnum.Pending].includes(status) &&
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
                  InvoiceStatusTypeEnum.Pending,
                ].includes(status) && hasPermissions(['invoicesUpdate'])
              const canVoid =
                status === InvoiceStatusTypeEnum.Finalized &&
                [
                  InvoicePaymentStatusTypeEnum.Pending,
                  InvoicePaymentStatusTypeEnum.Failed,
                ].includes(paymentStatus) &&
                hasPermissions(['invoicesVoid'])
              const canIssueCreditNote =
                ![InvoiceStatusTypeEnum.Draft, InvoiceStatusTypeEnum.Voided].includes(status) &&
                hasPermissions(['creditNotesCreate'])

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
                            severity: 'info',
                            translateKey: 'text_63b6d06df1a53b7e2ad973ad',
                          })
                        }
                      },
                    }
                  : null,
                canUpdatePaymentStatus
                  ? {
                      startIcon: 'coin-dollar',
                      title: translate('text_63eba8c65a6c8043feee2a01'),
                      onAction: () => {
                        updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
                      },
                    }
                  : null,
                canIssueCreditNote && !isPremium
                  ? {
                      startIcon: 'document',
                      endIcon: 'sparkles',
                      title: translate('text_636bdef6565341dcb9cfb127'),
                      onAction: () => premiumWarningDialogRef.current?.openDialog(),
                    }
                  : null,
                canIssueCreditNote && isPremium
                  ? {
                      startIcon: 'document',
                      title: translate('text_636bdef6565341dcb9cfb127'),
                      disabled: disabledIssueCreditNoteButton,
                      onAction: () => {
                        navigate(
                          generatePath(CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE, {
                            customerId: invoice?.customer?.id,
                            invoiceId: invoice.id,
                          }),
                        )
                      },
                      tooltip: disabledIssueCreditNoteButtonLabel
                        ? translate(disabledIssueCreditNoteButtonLabel)
                        : undefined,
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
                content: ({ status, errorDetails, taxProviderVoidable }) => {
                  const showWarningIcon =
                    (!!errorDetails?.length && status !== InvoiceStatusTypeEnum.Failed) ||
                    taxProviderVoidable

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
                    {number || '-'}
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
                      {[InvoiceStatusTypeEnum.Failed, InvoiceStatusTypeEnum.Pending].includes(
                        status,
                      )
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
                content: ({ status, paymentStatus, paymentDisputeLostAt }) => {
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
                        })}
                        endIcon={!!paymentDisputeLostAt ? 'warning-unfilled' : undefined}
                      />
                    </Tooltip>
                  )
                },
              },
              {
                key: 'paymentOverdue',
                title: translate('text_666c5b12fea4aa1e1b26bf55'),
                content: ({ paymentOverdue }) =>
                  paymentOverdue && (
                    <Chip error={true} label={translate('text_666c5b12fea4aa1e1b26bf55')} />
                  ),
              },
              {
                key: 'customer.name',
                title: translate('text_65201c5a175a4b0238abf29a'),
                maxSpace: true,
                minWidth: 160,
                content: ({ customer }) => (
                  <Typography variant="body" noWrap>
                    {customer?.displayName || '-'}
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
            onRowActionLink={(invoice) =>
              generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                customerId: invoice?.customer?.id,
                invoiceId: invoice.id,
                tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
              })
            }
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
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default InvoicesList
