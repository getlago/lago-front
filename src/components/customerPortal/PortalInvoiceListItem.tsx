import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { memo } from 'react'
import styled, { css } from 'styled-components'

import {
  Button,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  PortalInvoiceListItemFragment,
  useDownloadCustomerPortalInvoiceMutation,
} from '~/generated/graphql'
import { NAV_HEIGHT, theme } from '~/styles'

gql`
  fragment PortalInvoiceListItem on Invoice {
    id
    paymentStatus
    paymentOverdue
    number
    issuingDate
    totalAmountCents
    currency
  }

  mutation downloadCustomerPortalInvoice($input: DownloadCustomerPortalInvoiceInput!) {
    downloadCustomerPortalInvoice(input: $input) {
      id
      fileUrl
    }
  }

  ${InvoiceForFinalizeInvoiceFragmentDoc}
  ${InvoiceForUpdateInvoicePaymentStatusFragmentDoc}
`

interface PortalInvoiceListItemProps {
  invoice: PortalInvoiceListItemFragment
  translate: Function
  className?: string
  documentLocale: LocaleEnum
}

const mapStatusConfig = ({
  paymentStatus,
  paymentOverdue,
}: {
  paymentStatus: InvoicePaymentStatusTypeEnum
  paymentOverdue: boolean
}): StatusProps => {
  if (paymentOverdue) {
    return { label: 'overdue', type: StatusType.danger }
  }

  if (paymentStatus === InvoicePaymentStatusTypeEnum.Succeeded) {
    return { label: 'pay', type: StatusType.success }
  }

  return { label: 'toPay', type: StatusType.default }
}

export const PortalInvoiceListItem = memo(
  ({ className, invoice, translate, documentLocale }: PortalInvoiceListItemProps) => {
    const { id, issuingDate, number, paymentStatus, paymentOverdue, totalAmountCents, currency } =
      invoice
    const statusConfig = mapStatusConfig({ paymentStatus, paymentOverdue })

    const [downloadInvoice] = useDownloadCustomerPortalInvoiceMutation({
      onCompleted(data) {
        const fileUrl = data?.downloadCustomerPortalInvoice?.fileUrl

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
      <Item className={className}>
        <GridItem>
          <Typography color="grey700" noWrap>
            {DateTime.fromISO(issuingDate).toLocaleString(DateTime.DATE_MED, {
              locale: documentLocale,
            })}
          </Typography>
          <Typography variant="captionCode" color="grey700">
            {number}
          </Typography>
          <Typography color="grey700" align="right">
            {intlFormatNumber(deserializeAmount(totalAmountCents, currency || CurrencyEnum.Usd), {
              currency: currency || CurrencyEnum.Usd,
              locale: documentLocale,
            })}
          </Typography>
          <Status {...statusConfig} locale={documentLocale} />
          <Tooltip placement="top-end" title={translate('text_6419c64eace749372fc72b62')}>
            <Button
              icon="download"
              variant="quaternary"
              onClick={async () => await downloadInvoice({ variables: { input: { id } } })}
            />
          </Tooltip>
        </GridItem>
      </Item>
    )
  },
)

PortalInvoiceListItem.displayName = 'PortalInvoiceListItem'

interface PortalInvoiceListItemSkeletonProps {
  className?: string
}

export const PortalInvoiceListItemSkeleton = ({
  className,
}: PortalInvoiceListItemSkeletonProps) => {
  return (
    <SkeletonWrapper className={className}>
      <Skeleton variant="text" height={12} width={88} />
      <Skeleton variant="text" height={12} width={160} />
      <Skeleton variant="text" height={12} width={120} />
      <Skeleton variant="text" height={12} width={80} />
      <Button variant="quaternary" icon="download" disabled />
    </SkeletonWrapper>
  )
}

export const PortalInvoiceListItemGridTemplate = () => css`
  display: grid;
  grid-template-columns: 147px 1fr 1fr 104px 40px;
  gap: ${theme.spacing(3)};
`

const Grid = () => css`
  position: relative;
  align-items: center;
  width: 100%;
  ${PortalInvoiceListItemGridTemplate()}
`

const GridItem = styled.div`
  ${Grid()}
`

const Item = styled.div`
  width: 100%;
  box-sizing: border-box;
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(4)};
`

const SkeletonWrapper = styled(Item)`
  ${Grid()}

  > *:nth-child(3) {
    justify-self: flex-end;
  }
`
