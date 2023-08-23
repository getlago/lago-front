import { memo } from 'react'
import { DateTime } from 'luxon'
import styled, { css } from 'styled-components'
import { gql } from '@apollo/client'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  Skeleton,
  Button,
  Typography,
  StatusEnum,
  Status,
  Tooltip,
} from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { addToast } from '~/core/apolloClient'
import {
  PortalInvoiceListItemFragment,
  InvoicePaymentStatusTypeEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragmentDoc,
  useDownloadCustomerPortalInvoiceMutation,
  CurrencyEnum,
} from '~/generated/graphql'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

gql`
  fragment PortalInvoiceListItem on Invoice {
    id
    paymentStatus
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
  documentLocale: string
}

const mapStatusConfig = (paymentStatus: InvoicePaymentStatusTypeEnum) => {
  if (paymentStatus === InvoicePaymentStatusTypeEnum.Succeeded) {
    return { label: 'text_6419c64eace749372fc72b54', type: StatusEnum.running }
  }

  return { label: 'text_6419c64eace749372fc72b44', type: StatusEnum.paused }
}

export const PortalInvoiceListItem = memo(
  ({ className, invoice, translate, documentLocale }: PortalInvoiceListItemProps) => {
    const { id, issuingDate, number, paymentStatus, totalAmountCents, currency } = invoice
    const statusConfig = mapStatusConfig(paymentStatus)

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
            })}
          </Typography>
          <Status
            type={statusConfig?.type as StatusEnum}
            label={translate(statusConfig?.label || '')}
          />
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
  }
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
