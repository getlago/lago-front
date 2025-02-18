import { CreditNoteReasonEnum, CurrencyEnum } from '~/generated/graphql'

export type FromFee = {
  id: string
  checked: boolean
  maxAmount: number
  name: string
  value: string | number
  isTrueUpFee?: boolean
  succeededAt?: string
  appliedTaxes?: {
    id: string
    taxName: string
    taxRate: number
  }[]
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
  reason: CreditNoteReasonEnum
  creditAmount: number
  amountCurrency: CurrencyEnum
  refundAmount: number
  payBack: { type?: CreditTypeEnum; value?: number }[]
  description?: string
  fees?: FeesPerInvoice
  addOnFee?: FromFee[]
  creditFee?: FromFee[]
}

export enum CreditNoteFeeErrorEnum {
  minZero = 'minZero',
  overMax = 'overMax',
}

export enum PayBackErrorEnum {
  maxRefund = 'maxRefund',
  maxCredit = 'maxCredit',
  maxTotalInvoice = 'maxTotalInvoice',
}
