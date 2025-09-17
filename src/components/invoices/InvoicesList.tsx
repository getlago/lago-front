import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { IconName } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'

import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import {
  InfiniteScroll,
  Status,
  StatusType,
  Table,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
  Filters,
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from '~/components/designSystem/Filters'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { INVOICE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CREATE_INVOICE_PAYMENT_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_VOID_ROUTE,
  INVOICE_SETTINGS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile, openNewTab } from '~/core/utils/downloadFiles'
import { regeneratePath } from '~/core/utils/regenerateUtils'
import {
  CurrencyEnum,
  GetInvoicesListQuery,
  GetInvoicesListQueryResult,
  Invoice,
  InvoiceStatusTypeEnum,
  LagoApiError,
  PremiumIntegrationTypeEnum,
  useDownloadInvoiceItemMutation,
  useGeneratePaymentUrlMutation,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerHasActiveWallet } from '~/hooks/customer/useCustomerHasActiveWallet'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'

type TInvoiceListProps = {
  error: ApolloError | undefined
  fetchMore: GetInvoicesListQueryResult['fetchMore']
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
  const { isPremium } = useCurrentUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const actions = usePermissionsInvoiceActions()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const hasAccessToRevenueShare = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.RevenueShare,
  )

  const hasActiveWallet = useCustomerHasActiveWallet({
    customerId: invoices?.[0]?.customer?.id,
  })

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

  const [generatePaymentUrl] = useGeneratePaymentUrlMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted({ generatePaymentUrl: generatedPaymentUrl }) {
      if (generatedPaymentUrl?.paymentUrl) {
        openNewTab(generatedPaymentUrl.paymentUrl)
      }
    },
    onError(resError) {
      if (hasDefinedGQLError('MissingPaymentProviderCustomer', resError)) {
        addToast({
          severity: 'danger',
          translateKey: 'text_1756225393560tonww8d3bgq',
        })
      }
    },
  })

  return (
    <>
      <div className="box-border flex w-full flex-col gap-3 p-4 shadow-b md:px-12 md:py-3">
        <Filters.Provider
          filtersNamePrefix={INVOICE_LIST_FILTER_PREFIX}
          quickFiltersType={AvailableQuickFilters.invoiceStatus}
          availableFilters={[
            AvailableFiltersEnum.amount,
            AvailableFiltersEnum.billingEntityIds,
            AvailableFiltersEnum.status,
            AvailableFiltersEnum.invoiceType,
            AvailableFiltersEnum.paymentStatus,
            AvailableFiltersEnum.currency,
            AvailableFiltersEnum.issuingDate,
            AvailableFiltersEnum.customerExternalId,
            AvailableFiltersEnum.paymentDisputeLost,
            AvailableFiltersEnum.paymentOverdue,
            ...(hasAccessToRevenueShare ? [AvailableFiltersEnum.selfBilled] : []),
          ]}
        >
          <Filters.QuickFilters />
          <Filters.Component />
        </Filters.Provider>
      </div>

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
            const { disabledIssueCreditNoteButton, disabledIssueCreditNoteButtonLabel } =
              createCreditNoteForInvoiceButtonProps({
                invoiceType: invoice?.invoiceType,
                paymentStatus: invoice?.paymentStatus,
                creditableAmountCents: invoice?.creditableAmountCents,
                refundableAmountCents: invoice?.refundableAmountCents,
                associatedActiveWalletPresent: invoice?.associatedActiveWalletPresent,
              })

            const isPartiallyPaid =
              Number(invoice.totalPaidAmountCents) > 0 &&
              Number(invoice.totalAmountCents) - Number(invoice.totalPaidAmountCents) > 0

            return [
              actions.canDownload(invoice)
                ? {
                    startIcon: 'download',
                    title: translate('text_62b31e1f6a5b8b1b745ece42'),
                    onAction: async ({ id }) => {
                      await downloadInvoice({
                        variables: { input: { id } },
                      })
                    },
                  }
                : actions.canFinalize(invoice)
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

              actions.canRecordPayment(invoice)
                ? {
                    startIcon: 'receipt',
                    title: translate('text_1737471851634wpeojigr27w'),

                    endIcon: isPremium ? undefined : 'sparkles',
                    onAction: ({ id }) => {
                      if (isPremium) {
                        navigate(generatePath(CREATE_INVOICE_PAYMENT_ROUTE, { invoiceId: id }))
                      } else {
                        premiumWarningDialogRef.current?.openDialog()
                      }
                    },
                  }
                : null,

              actions.canRetryCollect(invoice)
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

              actions.canGeneratePaymentUrl(invoice)
                ? {
                    startIcon: 'link',
                    title: translate('text_1753384709668qrxbzpbskn8'),
                    onAction: async ({ id }) => {
                      await generatePaymentUrl({ variables: { input: { invoiceId: id } } })
                    },
                  }
                : null,

              actions.canUpdatePaymentStatus(invoice)
                ? {
                    startIcon: 'coin-dollar',
                    title: translate('text_63eba8c65a6c8043feee2a01'),
                    onAction: () => {
                      updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
                    },
                  }
                : null,

              actions.canIssueCreditNote(invoice) && !isPremium
                ? {
                    startIcon: 'document',
                    endIcon: 'sparkles',
                    title: translate('text_636bdef6565341dcb9cfb127'),
                    onAction: () => premiumWarningDialogRef.current?.openDialog(),
                  }
                : null,

              actions.canIssueCreditNote(invoice) && isPremium
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
                    tooltip:
                      !isPartiallyPaid && disabledIssueCreditNoteButtonLabel
                        ? translate(disabledIssueCreditNoteButtonLabel)
                        : undefined,
                  }
                : null,

              actions.canVoid(invoice)
                ? {
                    startIcon: 'stop',
                    title: translate('text_1750678506388d4fr5etxbhh'),
                    onAction: () =>
                      navigate(
                        generatePath(CUSTOMER_INVOICE_VOID_ROUTE, {
                          customerId: invoice?.customer?.id,
                          invoiceId: invoice.id,
                        }),
                      ),
                  }
                : null,

              actions.canRegenerate(invoice, hasActiveWallet)
                ? {
                    startIcon: 'stop',
                    title: translate('text_1750678506388oynw9hd01l9'),
                    onAction: () => navigate(regeneratePath(invoice as Invoice)),
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
              key: 'billingEntity.code',
              title: translate('text_17436114971570doqrwuwhf0'),
              content: ({ billingEntity }) => (
                <Typography variant="body" noWrap>
                  {billingEntity.name || billingEntity.code || '-'}
                </Typography>
              ),
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
                    {[InvoiceStatusTypeEnum.Failed, InvoiceStatusTypeEnum.Pending].includes(status)
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
              content: ({
                status,
                paymentStatus,
                paymentDisputeLostAt,
                totalAmountCents,
                totalPaidAmountCents,
              }) => {
                if (status !== InvoiceStatusTypeEnum.Finalized) {
                  return null
                }

                let content: { tooltipTitle?: string; statusEndIcon?: IconName } = {
                  tooltipTitle: undefined,
                  statusEndIcon: undefined,
                }

                const isPartiallyPaid =
                  Number(totalPaidAmountCents) > 0 &&
                  Number(totalAmountCents) - Number(totalPaidAmountCents) > 0

                if (isPartiallyPaid) {
                  content = {
                    tooltipTitle: translate('text_1738071221799vib0l2z1bxe'),
                    statusEndIcon: 'partially-filled',
                  }
                } else if (!!paymentDisputeLostAt) {
                  content = {
                    tooltipTitle: translate('text_172416478461328edo4vwz05'),
                    statusEndIcon: 'warning-unfilled',
                  }
                }

                return (
                  <Tooltip placement="top" title={content.tooltipTitle}>
                    <Status
                      {...paymentStatusMapping({
                        status,
                        paymentStatus,
                        totalPaidAmountCents,
                        totalAmountCents,
                      })}
                      endIcon={content.statusEndIcon}
                    />
                  </Tooltip>
                )
              },
            },
            {
              key: 'paymentOverdue',
              title: translate('text_666c5b12fea4aa1e1b26bf55'),
              content: ({ paymentOverdue }) =>
                paymentOverdue && <Status type={StatusType.danger} label="overdue" />,
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
                  {intlFormatDateTime(issuingDate, { timezone: customer.applicableTimezone }).date}
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
                    isSucceededUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX })
                      ? 'text_63c67d2913c20b8d7d05c44c'
                      : isDraftUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX })
                        ? 'text_63c67d2913c20b8d7d05c442'
                        : isOutstandingUrlParams({
                              searchParams,
                              prefix: INVOICE_LIST_FILTER_PREFIX,
                            })
                          ? 'text_63c67d8796db41749ada51ca'
                          : isVoidedUrlParams({
                                searchParams,
                                prefix: INVOICE_LIST_FILTER_PREFIX,
                              })
                            ? 'text_65269cd46e7ec037a6823fd8'
                            : 'text_63c67d2913c20b8d7d05c43e',
                  ),
                  subtitle: translate('text_66ab48ea4ed9cd01084c60b8'),
                }
              : {
                  title: translate(
                    isSucceededUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX })
                      ? 'text_63b578e959c1366df5d14559'
                      : isDraftUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX })
                        ? 'text_63b578e959c1366df5d1455b'
                        : isOutstandingUrlParams({
                              searchParams,
                              prefix: INVOICE_LIST_FILTER_PREFIX,
                            })
                          ? 'text_63b578e959c1366df5d1456e'
                          : isVoidedUrlParams({
                                searchParams,
                                prefix: INVOICE_LIST_FILTER_PREFIX,
                              })
                            ? 'text_65269cd46e7ec037a6823fd6'
                            : isPaymentDisputeLostUrlParams({
                                  searchParams,
                                  prefix: INVOICE_LIST_FILTER_PREFIX,
                                })
                              ? 'text_66141e30699a0631f0b2ec7f'
                              : isPaymentOverdueUrlParams({
                                    searchParams,
                                    prefix: INVOICE_LIST_FILTER_PREFIX,
                                  })
                                ? 'text_666c5b12fea4aa1e1b26bf70'
                                : 'text_63b578e959c1366df5d14569',
                  ),
                  subtitle: isSucceededUrlParams({
                    searchParams,
                    prefix: INVOICE_LIST_FILTER_PREFIX,
                  }) ? (
                    translate('text_63b578e959c1366df5d1455f')
                  ) : isDraftUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX }) ? (
                    <Typography
                      html={translate('text_63b578e959c1366df5d14566', {
                        link: INVOICE_SETTINGS_ROUTE,
                      })}
                    />
                  ) : isOutstandingUrlParams({
                      searchParams,
                      prefix: INVOICE_LIST_FILTER_PREFIX,
                    }) ? (
                    translate('text_63b578e959c1366df5d14570')
                  ) : isVoidedUrlParams({ searchParams, prefix: INVOICE_LIST_FILTER_PREFIX }) ? (
                    translate('text_65269cd46e7ec037a6823fda')
                  ) : isPaymentDisputeLostUrlParams({
                      searchParams,
                      prefix: INVOICE_LIST_FILTER_PREFIX,
                    }) ? (
                    translate('text_66141e30699a0631f0b2ec87')
                  ) : isPaymentOverdueUrlParams({
                      searchParams,
                      prefix: INVOICE_LIST_FILTER_PREFIX,
                    }) ? (
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

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default InvoicesList
