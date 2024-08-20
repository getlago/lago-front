import { FetchMoreQueryOptions, gql } from '@apollo/client'
import { FC, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { InfiniteScroll, Status, Table, Tooltip, Typography } from '~/components/designSystem'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { invoiceStatusMapping, paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ, getTimezoneConfig } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForInvoiceListFragment,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  LagoApiError,
  TimezoneEnum,
  useDownloadInvoiceItemMutation,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { theme } from '~/styles'

import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '../invoices/EditInvoicePaymentStatusDialog'
import { FinalizeInvoiceDialog, FinalizeInvoiceDialogRef } from '../invoices/FinalizeInvoiceDialog'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '../invoices/VoidInvoiceDialog'

gql`
  fragment InvoiceListItem on Invoice {
    id
    status
    paymentStatus
    paymentOverdue
    number
    issuingDate
    totalAmountCents
    currency
    voidable
    paymentDisputeLostAt
    customer {
      id
      name
      applicableTimezone
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
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

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
          onRowAction={({ id }) =>
            navigate(
              generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                customerId,
                invoiceId: id,
                tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
              }),
            )
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
              content: ({ status }) => <Status {...invoiceStatusMapping({ status })} />,
            },
            {
              key: 'number',
              minWidth: 160,
              title: translate('text_63ac86d797f728a87b2f9fad'),
              content: (invoice) => invoice.number,
            },
            {
              key: 'totalAmountCents',
              maxSpace: true,
              textAlign: 'right',
              minWidth: 160,
              title: translate('text_63ac86d797f728a87b2f9fb9'),
              content: (invoice) => {
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
                  content: ({ status, paymentStatus, paymentOverdue, paymentDisputeLostAt }) => {
                    if (status !== InvoiceStatusTypeEnum.Finalized) {
                      return null
                    }

                    return (
                      <Tooltip
                        placement="top"
                        title={
                          !!paymentDisputeLostAt
                            ? translate('TODO: This invoice contains a dispute lost')
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
                  <WithTooltip variant="captionHl" color="grey600" noWrap>
                    {translate('text_62544c1db13ca10187214d7f')}
                  </WithTooltip>
                </Tooltip>
              ),
              content: ({ issuingDate, customer }) =>
                formatDateToTZ(issuingDate, customer.applicableTimezone),
            },
          ]}
          actionColumn={(invoice) => {
            const { status, paymentStatus, voidable } = invoice

            const canDownload =
              ![InvoiceStatusTypeEnum.Draft, InvoiceStatusTypeEnum.Failed].includes(status) &&
              hasPermissions(['invoicesView'])
            const canFinalize =
              ![InvoiceStatusTypeEnum.Failed].includes(status) && hasPermissions(['invoicesUpdate'])
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
              ].includes(status) && hasPermissions(['invoicesUpdate'])
            const canVoid =
              status === InvoiceStatusTypeEnum.Finalized &&
              [InvoicePaymentStatusTypeEnum.Pending, InvoicePaymentStatusTypeEnum.Failed].includes(
                paymentStatus,
              ) &&
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
        />
      </InfiniteScroll>

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
    </>
  )
}

const WithTooltip = styled(Typography)`
  border-bottom: 2px dotted ${theme.palette.grey[400]};
  width: fit-content;
  margin-top: 2px;
  float: right;
`
