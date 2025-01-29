import { FetchMoreQueryOptions, gql } from '@apollo/client'
import { FC, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { createCreditNoteForInvoiceButtonProps } from '~/components/creditNote/utils'
import { Chip, InfiniteScroll, Status, Table, Tooltip, Typography } from '~/components/designSystem'
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
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ, getTimezoneConfig } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForInvoiceListFragment,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  LagoApiError,
  PremiumIntegrationTypeEnum,
  TimezoneEnum,
  useDownloadInvoiceItemMutation,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

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
    customer {
      id
      name
      displayName
      applicableTimezone
    }
    errorDetails {
      errorCode
      errorDetails
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

  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
`

interface CustomerInvoicesListProps {
  isLoading: boolean
  hasError?: boolean
  invoiceData?: InvoiceForInvoiceListFragment
  customerTimezone?: TimezoneEnum
  customerId: string
  context?: 'finalized' | 'draft'
  fetchMore?: (options: FetchMoreQueryOptions<{ page: number }>) => Promise<unknown>
}

export const CustomerInvoicesList: FC<CustomerInvoicesListProps> = ({
  isLoading,
  hasError = false,
  invoiceData,
  customerTimezone = TimezoneEnum.TzUtc,
  customerId,
  context = 'draft',
  fetchMore,
}) => {
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

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
            errorState: {
              title: translate('text_634812d6f16b31ce5cbf4111'),
              subtitle: translate('text_634812d6f16b31ce5cbf411f'),
              buttonTitle: translate('text_634812d6f16b31ce5cbf4123'),
              buttonAction: () => location.reload(),
            },
            emptyState: {
              title: translate('text_63c6cac5c1fc58028d0235eb'),
              subtitle: translate('text_63c6cac5c1fc58028d0235ef'),
            },
          }}
          columns={[
            {
              key: 'status',
              minWidth: 80,
              title: translate('text_63ac86d797f728a87b2f9fa7'),
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
              title: translate('text_63ac86d797f728a87b2f9fad'),
              content: (invoice) => invoice.number || '-',
            },
            {
              key: 'totalAmountCents',
              maxSpace: true,
              textAlign: 'right',
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
            context === 'finalized'
              ? {
                  key: 'paymentStatus',
                  minWidth: 120,
                  title: translate('text_63b5d225b075850e0fe489f4'),
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
                }
              : null,
            context === 'finalized'
              ? {
                  key: 'paymentOverdue',
                  title: translate('text_666c5b12fea4aa1e1b26bf55'),
                  content: ({ paymentOverdue }) =>
                    paymentOverdue && (
                      <Chip error={true} label={translate('text_666c5b12fea4aa1e1b26bf55')} />
                    ),
                }
              : null,
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
                formatDateToTZ(issuingDate, customer.applicableTimezone),
            },
          ]}
          actionColumn={(invoice) => {
            const {
              status,
              paymentStatus,
              voidable,
              taxStatus,
              totalPaidAmountCents,
              totalDueAmountCents,
              totalAmountCents,
            } = invoice

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
              ].includes(status) &&
              taxStatus !== InvoiceTaxStatusTypeEnum.Pending &&
              hasPermissions(['invoicesView'])
            const canFinalize =
              ![InvoiceStatusTypeEnum.Failed, InvoiceStatusTypeEnum.Pending].includes(status) &&
              hasPermissions(['invoicesUpdate'])
            const canRetryCollect =
              status === InvoiceStatusTypeEnum.Finalized &&
              [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending].includes(
                paymentStatus,
              ) &&
              hasPermissions(['invoicesSend'])
            const canUpdatePaymentStatus =
              ![
                InvoiceStatusTypeEnum.Draft,
                InvoiceStatusTypeEnum.Voided,
                InvoiceStatusTypeEnum.Failed,
                InvoiceStatusTypeEnum.Pending,
              ].includes(status) &&
              taxStatus !== InvoiceTaxStatusTypeEnum.Pending &&
              hasPermissions(['invoicesUpdate'])
            const canVoid =
              status === InvoiceStatusTypeEnum.Finalized &&
              [InvoicePaymentStatusTypeEnum.Pending, InvoicePaymentStatusTypeEnum.Failed].includes(
                paymentStatus,
              ) &&
              hasPermissions(['invoicesVoid'])
            const canIssueCreditNote =
              ![InvoiceStatusTypeEnum.Draft, InvoiceStatusTypeEnum.Voided].includes(status) &&
              hasPermissions(['creditNotesCreate'])
            const canRecordPayment =
              Number(totalDueAmountCents) > 0 &&
              hasPermissions(['paymentsCreate']) &&
              Number(totalPaidAmountCents) < Number(totalAmountCents)

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

              canRecordPayment
                ? {
                    startIcon: 'receipt',
                    title: translate('text_1737471851634wpeojigr27w'),

                    endIcon: premiumIntegrations?.includes(
                      PremiumIntegrationTypeEnum.ManualPayments,
                    )
                      ? undefined
                      : 'sparkles',
                    onAction: ({ id }) => {
                      if (
                        premiumIntegrations?.includes(PremiumIntegrationTypeEnum.ManualPayments)
                      ) {
                        navigate(generatePath(CREATE_INVOICE_PAYMENT_ROUTE, { invoiceId: id }))
                      } else {
                        premiumWarningDialogRef.current?.openDialog({
                          title: translate('text_1738059367337v2tfzq3mr5u'),
                          description: translate('text_1738059367337mm2dwg2af6g'),
                          mailtoSubject: translate('text_1738059367337hy6e2c7pa3t'),
                          mailtoBody: translate('text_1738059367337km2lr0xueue'),
                        })
                      }
                    },
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
        />
      </InfiniteScroll>
      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}
