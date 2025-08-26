import { FetchMoreQueryOptions, gql } from '@apollo/client'
import { IconName } from 'lago-design-system'
import { FC, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

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
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CREATE_INVOICE_PAYMENT_ROUTE,
  CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_VOID_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { getTimezoneConfig, intlFormatDateTime } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile, openNewTab } from '~/core/utils/downloadFiles'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForInvoiceListFragment,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  LagoApiError,
  TimezoneEnum,
  useDownloadInvoiceItemMutation,
  useGeneratePaymentUrlMutation,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'

gql`
  fragment InvoiceListItem on Invoice {
    id
    status
    taxStatus
    paymentStatus
    paymentOverdue
    number
    issuingDate
    totalAmountCents
    totalDueAmountCents
    totalPaidAmountCents
    currency
    voidable
    paymentDisputeLostAt
    taxProviderVoidable
    invoiceType
    creditableAmountCents
    refundableAmountCents
    associatedActiveWalletPresent
    voidedInvoiceId
    regeneratedInvoiceId
    customer {
      id
      name
      displayName
      applicableTimezone
      paymentProvider
    }
    errorDetails {
      errorCode
      errorDetails
    }
    billingEntity {
      name
      code
    }

    ...InvoiceForFinalizeInvoice
    ...InvoiceForUpdateInvoicePaymentStatus
  }

  fragment InvoiceForInvoiceList on InvoiceCollection {
    collection {
      id
      customer {
        id
        applicableTimezone
      }
      ...InvoiceListItem
    }
    metadata {
      currentPage
      totalCount
      totalPages
    }
  }

  mutation downloadInvoiceItem($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  mutation retryInvoicePayment($input: RetryInvoicePaymentInput!) {
    retryInvoicePayment(input: $input) {
      id
      ...InvoiceListItem
    }
  }

  mutation generatePaymentUrl($input: GeneratePaymentUrlInput!) {
    generatePaymentUrl(input: $input) {
      paymentUrl
    }
  }

  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
`

interface CustomerInvoicesListProps {
  isSearching?: boolean
  isLoading: boolean
  hasError?: boolean
  invoiceData?: InvoiceForInvoiceListFragment
  customerTimezone?: TimezoneEnum
  customerId: string
  fetchMore?: (options: FetchMoreQueryOptions<{ page: number }>) => Promise<unknown>
}

export const CustomerInvoicesList: FC<CustomerInvoicesListProps> = ({
  isSearching,
  isLoading,
  hasError = false,
  invoiceData,
  customerTimezone = TimezoneEnum.TzUtc,
  customerId,
  fetchMore,
}) => {
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const actions = usePermissionsInvoiceActions()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

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
  const [downloadInvoice] = useDownloadInvoiceItemMutation({
    onCompleted({ downloadInvoice: data }) {
      handleDownloadFile(data?.fileUrl)
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
    onError(error) {
      if (hasDefinedGQLError('MissingPaymentProviderCustomer', error)) {
        addToast({
          severity: 'danger',
          translateKey: 'text_1756225393560tonww8d3bgq',
        })
      }
    },
  })

  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)

  return (
    <>
      <InfiniteScroll
        onBottom={() => {
          if (!fetchMore) return

          const { currentPage = 0, totalPages = 0 } = invoiceData?.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore({ variables: { page: currentPage + 1 } })
        }}
      >
        <Table
          name="customer-invoices"
          containerSize={{ default: 4 }}
          isLoading={isLoading}
          hasError={hasError}
          data={invoiceData?.collection ?? []}
          onRowActionLink={({ id }) =>
            generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
              customerId,
              invoiceId: id,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
            })
          }
          placeholder={{
            errorState: isSearching
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_634812d6f16b31ce5cbf4111'),
                  subtitle: translate('text_634812d6f16b31ce5cbf411f'),
                  buttonTitle: translate('text_634812d6f16b31ce5cbf4123'),
                  buttonAction: () => location.reload(),
                },
            emptyState: isSearching
              ? {
                  title: translate('text_63c6cac5c1fc58028d0235eb'),
                  subtitle: translate('text_63c6cac5c1fc58028d0235ef'),
                }
              : {
                  title: translate('text_63b578e959c1366df5d14569'),
                  subtitle: translate('text_6250304370f0f700a8fdc293'),
                },
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
              minWidth: 160,
              maxSpace: true,
              title: translate('text_63ac86d797f728a87b2f9fad'),
              content: (invoice) => invoice.number || '-',
            },
            {
              key: 'totalAmountCents',
              textAlign: 'right',
              maxSpace: true,
              minWidth: 160,
              title: translate('text_63ac86d797f728a87b2f9fb9'),
              content: (invoice) => {
                if (
                  invoice.status === InvoiceStatusTypeEnum.Failed ||
                  invoice.taxStatus === InvoiceTaxStatusTypeEnum.Pending
                )
                  return '-'

                const currency = invoice.currency || CurrencyEnum.Usd
                const amount = deserializeAmount(invoice.totalAmountCents, currency)

                return (
                  <Typography variant="bodyHl" color="textSecondary" noWrap>
                    {intlFormatNumber(amount, { currency })}
                  </Typography>
                )
              },
            },
            {
              key: 'paymentStatus',
              minWidth: 120,
              title: translate('text_63b5d225b075850e0fe489f4'),
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
              key: 'issuingDate',
              minWidth: 104,
              title: (
                <Tooltip
                  placement="top-start"
                  title={translate('text_6390ea10cf97ec5780001c9d', {
                    offset: getTimezoneConfig(customerTimezone).offset,
                  })}
                >
                  <Typography
                    className="float-right mt-[2px] w-fit border-b-2 border-dotted border-b-grey-400"
                    variant="captionHl"
                    color="grey600"
                    noWrap
                  >
                    {translate('text_62544c1db13ca10187214d7f')}
                  </Typography>
                </Tooltip>
              ),
              content: ({ issuingDate, customer }) =>
                intlFormatDateTime(issuingDate, {
                  timezone: customer.applicableTimezone,
                }).date,
            },
          ]}
          actionColumn={(invoice) => {
            const {
              canDownload,
              canFinalize,
              canGeneratePaymentUrl,
              canIssueCreditNote,
              canRecordPayment,
              canRetryCollect,
              canUpdatePaymentStatus,
              canVoid,
            } = actions

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
              canDownload(invoice)
                ? {
                    startIcon: 'download',
                    title: translate('text_62b31e1f6a5b8b1b745ece42'),
                    onAction: async ({ id }) => {
                      await downloadInvoice({
                        variables: { input: { id } },
                      })
                    },
                  }
                : canFinalize(invoice)
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

              canRecordPayment(invoice)
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

              canRetryCollect(invoice)
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

              canGeneratePaymentUrl(invoice)
                ? {
                    startIcon: 'link',
                    title: translate('text_1753384709668qrxbzpbskn8'),
                    onAction: async ({ id }) => {
                      await generatePaymentUrl({ variables: { input: { invoiceId: id } } })
                    },
                  }
                : null,

              canUpdatePaymentStatus(invoice)
                ? {
                    startIcon: 'coin-dollar',
                    title: translate('text_63eba8c65a6c8043feee2a01'),
                    onAction: () => {
                      updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
                    },
                  }
                : null,

              canIssueCreditNote(invoice) && !isPremium
                ? {
                    startIcon: 'document',
                    endIcon: 'sparkles',
                    title: translate('text_636bdef6565341dcb9cfb127'),
                    onAction: () => premiumWarningDialogRef.current?.openDialog(),
                  }
                : null,

              canIssueCreditNote(invoice) && isPremium
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

              canVoid(invoice)
                ? {
                    startIcon: 'stop',
                    title: translate('text_65269b43d4d2b15dd929a259'),
                    onAction: () =>
                      navigate(
                        generatePath(CUSTOMER_INVOICE_VOID_ROUTE, {
                          customerId: invoice?.customer?.id,
                          invoiceId: invoice.id,
                        }),
                      ),
                  }
                : null,
            ]
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
