import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  InfiniteScroll,
  QuickFilters,
  Status,
  StatusProps,
  StatusType,
  Table,
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
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
} from '~/core/router'
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
import { NAV_HEIGHT, theme } from '~/styles'

import { AvailableQuickFilters } from '../designSystem/Filters/types'
import {
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from '../designSystem/Filters/utils'

const mapStatusConfig = ({
  status,
  paymentStatus,
  paymentOverdue,
}: {
  status: InvoiceStatusTypeEnum
  paymentStatus: InvoicePaymentStatusTypeEnum
  paymentOverdue: boolean
}): StatusProps => {
  if (status === InvoiceStatusTypeEnum.Draft) {
    return { label: 'draft', type: StatusType.outline }
  }

  if (status === InvoiceStatusTypeEnum.Voided) {
    return { label: 'voided', type: StatusType.disabled }
  }

  if (paymentStatus === InvoicePaymentStatusTypeEnum.Succeeded) {
    return { label: 'succeeded', type: StatusType.success }
  }

  if (paymentOverdue) {
    return { label: 'overdue', type: StatusType.danger }
  }

  if (
    status === InvoiceStatusTypeEnum.Finalized &&
    paymentStatus === InvoicePaymentStatusTypeEnum.Failed
  ) {
    return { label: 'failed', type: StatusType.warning }
  }

  if (
    status === InvoiceStatusTypeEnum.Finalized &&
    paymentStatus === InvoicePaymentStatusTypeEnum.Pending
  ) {
    return { label: 'pending', type: StatusType.default }
  }

  return { label: 'n/a', type: StatusType.default }
}

type TInvoiceListProps = {
  error: ApolloError | undefined
  fetchMore: Function
  invoices: GetInvoicesListQuery['invoices']['collection'] | undefined
  isLoading: boolean
  metadata: GetInvoicesListQuery['invoices']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
}

const InvoicesListV2 = ({
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
        <QuickFilters type={AvailableQuickFilters.InvoiceStatus} />
      </FiltersWrapper>

      <ScrollContainer ref={listContainerElementRef}>
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
                status !== InvoiceStatusTypeEnum.Draft && hasPermissions(['invoicesView'])
              const canFinalize = hasPermissions(['invoicesUpdate'])
              const canRetryCollect =
                status === InvoiceStatusTypeEnum.Finalized &&
                [
                  InvoicePaymentStatusTypeEnum.Failed,
                  InvoicePaymentStatusTypeEnum.Pending,
                ].includes(paymentStatus) &&
                hasPermissions(['invoicesSend'])
              const canUpdatePaymentStatus =
                status !== InvoiceStatusTypeEnum.Draft &&
                status !== InvoiceStatusTypeEnum.Voided &&
                hasPermissions(['invoicesUpdate'])
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
                content: ({ status, paymentStatus, paymentOverdue, paymentDisputeLostAt }) => {
                  if (!!paymentDisputeLostAt) {
                    return <Status type={StatusType.danger} label="disputed" />
                  }

                  return <Status {...mapStatusConfig({ status, paymentStatus, paymentOverdue })} />
                },
              },
              {
                key: 'number',
                title: translate('text_63ac86d797f728a87b2f9fad'),
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
                content: ({ totalAmountCents, currency }) => (
                  <Typography variant="bodyHl" color="textSecondary" noWrap>
                    {intlFormatNumber(
                      deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd),
                      {
                        currency: currency || CurrencyEnum.Usd,
                      },
                    )}
                  </Typography>
                ),
              },
              {
                key: 'customer.name',
                title: translate('text_63ac86d797f728a87b2f9fb3'),
                maxSpace: true,
                content: ({ customer }) =>
                  customer ? (
                    <StyledLink
                      to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                        customerId: customer.id,
                      })}
                    >
                      {customer.name}
                    </StyledLink>
                  ) : (
                    <Typography variant="bodyHl" color="textSecondary" noWrap>
                      -
                    </Typography>
                  ),
              },
              {
                key: 'issuingDate',
                title: translate('text_63ac86d797f728a87b2f9fbf'),
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
                    subtitle: translate('text_63c67d2913c20b8d7d05c446'),
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
      </ScrollContainer>

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
    </>
  )
}

export default InvoicesListV2

const ScrollContainer = styled.div`
  overflow: auto;
  height: calc(100vh - ${NAV_HEIGHT + 52 + 68}px);
`

const FiltersWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
  box-sizing: border-box;
  gap: ${theme.spacing(3)};

  &:first-child {
    padding-bottom: 0;
  }

  &:last-child {
    padding-top: 0;
  }
`

const StyledLink = styled(Link)`
  color: ${theme.palette.primary[600]};

  &:visited {
    color: ${theme.palette.primary[600]};
  }
`
