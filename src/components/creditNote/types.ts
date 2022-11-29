import { CreditNoteReasonEnum } from '~/generated/graphql'

export type FromFee = {
  id: string
  checked: boolean
  maxAmount: number
  name: string
  value: string | number
  vatRate: number
}

export type GroupedFee = {
  name: string
  grouped: {
    [key: string]: FromFee
  }
}
export interface FeesPerInvoice {
  [subcriptionId: string]: {
    subscriptionName: string
    fees: {
      [feeGroupId: string]: FromFee | GroupedFee
    }
  }
}

export enum CreditTypeEnum {
  credit = 'credit',
  refund = 'refund',
}

export interface CreditNoteForm {
  description?: string
  reason: CreditNoteReasonEnum
  fees: FeesPerInvoice
  creditAmount: number
  refundAmount: number
  payBack: { type?: CreditTypeEnum; value?: number }[]
}

export enum CreditNoteFeeErrorEnum {
  minZero = 'minZero',
  overMax = 'overMax',
}

export enum PayBackErrorEnum {
  maxRefund = 'maxRefund',
}
