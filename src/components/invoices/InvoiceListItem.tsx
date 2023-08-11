import { RefObject } from 'react'
import styled, { css } from 'styled-components'
import { gql } from '@apollo/client'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { Skeleton, Button, Typography, StatusEnum, Status, Popper } from '~/components/designSystem'
import { theme, BaseListItem, ListItemLink, MenuPopper, NAV_HEIGHT } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  InvoiceListItemFragment,
  InvoiceStatusTypeEnum,
  InvoicePaymentStatusTypeEnum,
  useDownloadInvoiceItemMutation,
  InvoiceForFinalizeInvoiceFragmentDoc,
  useRetryInvoicePaymentMutation,
  LagoApiError,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  CurrencyEnum,
} from '~/generated/graphql'
import { formatDateToTZ } from '~/core/timezone'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { copyToClipboard } from '~/core/utils/copyToClipboard'

import { FinalizeInvoiceDialogRef } from './FinalizeInvoiceDialog'
import { UpdateInvoicePaymentStatusDialogRef } from './EditInvoicePaymentStatusDialog'

gql`
  fragment InvoiceListItem on Invoice {
    id
    status
    paymentStatus
    number
    issuingDate
    totalAmountCents
    currency
    customer {
      id
      name
      applicableTimezone
    }
    ...InvoiceForFinalizeInvoice
    ...InvoiceForUpdateInvoicePaymentStatus
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

export enum InvoiceListItemContextEnum {
  customer = 'customer',
  organization = 'organization',
}

type InvoiceListContext = keyof typeof InvoiceListItemContextEnum

interface InvoiceListItemProps {
  context: InvoiceListContext
  invoice: InvoiceListItemFragment
  to: string
  navigationProps?: ListKeyNavigationItemProps
  className?: string
  finalizeInvoiceRef: RefObject<FinalizeInvoiceDialogRef>
  updateInvoicePaymentStatusDialog: RefObject<UpdateInvoicePaymentStatusDialogRef>
}

const mapStatusConfig = (
  status: InvoiceStatusTypeEnum,
  paymentStatus: InvoicePaymentStatusTypeEnum
) => {
  if (status === InvoiceStatusTypeEnum.Draft) {
    return { label: 'text_63ac8850ff7117ad55777d31', type: StatusEnum.draft }
  }

  if (paymentStatus === InvoicePaymentStatusTypeEnum.Succeeded) {
    return { label: 'text_63ac8850ff7117ad55777d4f', type: StatusEnum.running }
  }

  if (
    status === InvoiceStatusTypeEnum.Finalized &&
    paymentStatus === InvoicePaymentStatusTypeEnum.Failed
  ) {
    return { label: 'text_63ac8850ff7117ad55777d45', type: StatusEnum.failed }
  }

  if (
    status === InvoiceStatusTypeEnum.Finalized &&
    paymentStatus === InvoicePaymentStatusTypeEnum.Pending
  ) {
    return { label: 'text_63ac8850ff7117ad55777d3b', type: StatusEnum.paused }
  }
}

export const InvoiceListItem = ({
  className,
  context,
  invoice,
  to,
  navigationProps,
  finalizeInvoiceRef,
  updateInvoicePaymentStatusDialog,
  ...props
}: InvoiceListItemProps) => {
  const { translate } = useInternationalization()
  const { id, status, paymentStatus, number, issuingDate, customer, totalAmountCents, currency } =
    invoice
  const statusConfig = mapStatusConfig(status, paymentStatus)
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

  return (
    <Container {...props}>
      <Item className={className} to={to} tabIndex={0} {...navigationProps} $context={context}>
        <GridItem $context={context}>
          <Status
            type={statusConfig?.type as StatusEnum}
            label={translate(statusConfig?.label || '')}
          />
          <Typography variant="captionCode" color="grey700" noWrap>
            {number}
          </Typography>
          {context === InvoiceListItemContextEnum.organization && (
            <CustomerName color="grey700" noWrap>
              {customer?.name || '-'}
            </CustomerName>
          )}
          <Typography color="grey700" align="right">
            {intlFormatNumber(deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd), {
              currency: currency || CurrencyEnum.Usd,
            })}
          </Typography>
          <Typography color="grey700" align="right">
            {formatDateToTZ(issuingDate, customer.applicableTimezone)}
          </Typography>
        </GridItem>
        <div />
      </Item>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={
          <PopperOpener $context={context}>
            <Button icon="dots-horizontal" variant="quaternary" />
          </PopperOpener>
        }
      >
        {({ closePopper }) => (
          <MenuPopper>
            {status !== InvoiceStatusTypeEnum.Draft ? (
              <Button
                startIcon="download"
                variant="quaternary"
                align="left"
                onClick={async () => {
                  await downloadInvoice({
                    variables: { input: { id } },
                  })
                }}
              >
                {translate('text_62b31e1f6a5b8b1b745ece42')}
              </Button>
            ) : (
              <Button
                startIcon="checkmark"
                variant="quaternary"
                align="left"
                onClick={() => {
                  finalizeInvoiceRef.current?.openDialog(invoice)
                }}
              >
                {translate('text_63a41a8eabb9ae67047c1c08')}
              </Button>
            )}
            {status === InvoiceStatusTypeEnum.Finalized &&
              [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending].includes(
                paymentStatus
              ) && (
                <Button
                  startIcon="push"
                  variant="quaternary"
                  align="left"
                  onClick={async () => {
                    const { errors } = await retryCollect({
                      variables: {
                        input: {
                          id,
                        },
                      },
                    })

                    if (hasDefinedGQLError('PaymentProcessorIsCurrentlyHandlingPayment', errors)) {
                      addToast({
                        severity: 'danger',
                        translateKey: 'text_63b6d06df1a53b7e2ad973ad',
                      })
                    }

                    closePopper()
                  }}
                >
                  {translate('text_63ac86d897f728a87b2fa039')}
                </Button>
              )}
            <Button
              startIcon="duplicate"
              variant="quaternary"
              align="left"
              onClick={() => {
                copyToClipboard(id)
                addToast({
                  severity: 'info',
                  translateKey: 'text_63ac86d897f728a87b2fa0b0',
                })
                closePopper()
              }}
            >
              {translate('text_63ac86d897f728a87b2fa031')}
            </Button>
            {status !== InvoiceStatusTypeEnum.Draft && (
              <Button
                startIcon="coin-dollar"
                variant="quaternary"
                align="left"
                onClick={() => {
                  updateInvoicePaymentStatusDialog?.current?.openDialog(invoice)
                  closePopper()
                }}
              >
                {translate('text_63eba8c65a6c8043feee2a01')}
              </Button>
            )}
          </MenuPopper>
        )}
      </Popper>
    </Container>
  )
}

interface InvoiceListItemSkeletonProps {
  context: InvoiceListContext
  className?: string
}

export const InvoiceListItemSkeleton = ({ className, context }: InvoiceListItemSkeletonProps) => {
  return (
    <SkeletonItem className={className} $context={context}>
      <StatusBlock>
        <Skeleton variant="circular" height={12} width={12} />
        <Skeleton variant="text" height={12} width={92} />
      </StatusBlock>
      <Skeleton variant="text" height={12} width={160} />
      <div />
      <Skeleton variant="text" height={12} width={120} />
      <PopperOpener $context={context}>
        <Button variant="quaternary" icon="dots-horizontal" disabled />
      </PopperOpener>
    </SkeletonItem>
  )
}

export const InvoiceListItemGridTemplate = (context: InvoiceListContext) => css`
  display: grid;
  grid-template-columns: ${context === InvoiceListItemContextEnum.organization
    ? '112px 160px 1fr 160px 112px 40px'
    : '112px 1fr 160px 112px 40px'};
  gap: ${theme.spacing(3)};

  ${theme.breakpoints.down('md')} {
    grid-template-columns: 112px 1fr 160px 112px 40px;
  }
`

const Grid = (context: InvoiceListContext) => css`
  position: relative;
  align-items: center;
  width: 100%;
  ${InvoiceListItemGridTemplate(context)}
`

const GridItem = styled.div<{ $context: InvoiceListContext }>`
  ${({ $context }) => Grid($context)}
`

const CustomerName = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const SkeletonItem = styled(BaseListItem)<{ $context: InvoiceListContext }>`
  ${() => Grid(InvoiceListItemContextEnum.customer)}
  ${({ $context }) =>
    $context === InvoiceListItemContextEnum.customer &&
    css`
      padding: 0 ${theme.spacing(4)};
    `}
`

const Item = styled(ListItemLink)<{ $context: InvoiceListContext }>`
  position: relative;
  ${({ $context }) =>
    $context === InvoiceListItemContextEnum.customer &&
    css`
      padding: 0 ${theme.spacing(4)};
    `}
`

const StatusBlock = styled.div`
  display: flex;
  align-items: center;
  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

const PopperOpener = styled.div<{ $context: InvoiceListContext }>`
  position: absolute;
  right: ${({ $context }) =>
    theme.spacing($context === InvoiceListItemContextEnum.customer ? 4 : 12)};
  top: ${NAV_HEIGHT / 2 - 20}px;
  z-index: 1;

  ${theme.breakpoints.down('md')} {
    right: ${theme.spacing(4)};
  }
`

const Container = styled.div`
  position: relative;
`
