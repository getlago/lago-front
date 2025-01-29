import { StatusProps, StatusType } from '~/components/designSystem'
import {
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  PayablePaymentStatusEnum,
} from '~/generated/graphql'

export const invoiceStatusMapping = ({
  status,
}: {
  status: InvoiceStatusTypeEnum
}): StatusProps => {
  switch (status) {
    case InvoiceStatusTypeEnum.Draft:
      return { label: 'draft', type: StatusType.outline }
    case InvoiceStatusTypeEnum.Failed:
      return { label: 'failed', type: StatusType.warning }
    case InvoiceStatusTypeEnum.Finalized:
      return { label: 'finalized', type: StatusType.success }
    case InvoiceStatusTypeEnum.Voided:
      return { label: 'voided', type: StatusType.disabled }
    case InvoiceStatusTypeEnum.Pending:
      return { label: 'pending', type: StatusType.default }
    default:
      return { label: 'n/a', type: StatusType.default }
  }
}

export const paymentStatusMapping = ({
  status,
  paymentStatus,
}: {
  status: InvoiceStatusTypeEnum
  paymentStatus: InvoicePaymentStatusTypeEnum
}): StatusProps => {
  if (status === InvoiceStatusTypeEnum.Finalized) {
    switch (paymentStatus) {
      case InvoicePaymentStatusTypeEnum.Pending:
        return { label: 'pending', type: StatusType.default }
      case InvoicePaymentStatusTypeEnum.Failed:
        return { label: 'failed', type: StatusType.warning }
      case InvoicePaymentStatusTypeEnum.Succeeded:
        return { label: 'succeeded', type: StatusType.success }

      default:
        return { label: 'n/a', type: StatusType.default }
    }
  }

  return { label: 'n/a', type: StatusType.default }
}

export const payablePaymentStatusMapping = ({
  payablePaymentStatus,
}: {
  payablePaymentStatus?: PayablePaymentStatusEnum
}): StatusProps => {
  switch (payablePaymentStatus) {
    case PayablePaymentStatusEnum.Pending:
      return { label: 'pending', type: StatusType.default }
    case PayablePaymentStatusEnum.Failed:
      return { label: 'failed', type: StatusType.warning }
    case PayablePaymentStatusEnum.Succeeded:
      return { label: 'succeeded', type: StatusType.success }
    default:
      return { label: 'n/a', type: StatusType.default }
  }
}
