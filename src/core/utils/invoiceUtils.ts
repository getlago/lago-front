import { FeeInput, Invoice, InvoiceTypeEnum } from '~/generated/graphql'

export const isOneOff = (invoice: Pick<Invoice, 'invoiceType'>) => {
  return [
    InvoiceTypeEnum.AddOn,
    InvoiceTypeEnum.Credit,
    InvoiceTypeEnum.OneOff,
    InvoiceTypeEnum.AdvanceCharges,
  ].includes(invoice.invoiceType)
}

export const isPrepaidCredit = (invoice: Pick<Invoice, 'invoiceType'>) => {
  return [InvoiceTypeEnum.Credit].includes(invoice.invoiceType)
}

export const invoiceFeesToFeeInput = (
  invoice: Pick<Invoice, 'fees'> | undefined,
): FeeInput[] | null | undefined => {
  return invoice?.fees?.map((fee) => ({
    addOnId: fee?.addOn?.id as string,
    description: fee.description,
    id: fee.id,
    invoiceDisplayName: fee.invoiceDisplayName,
    name: fee.itemName,
    unitAmountCents: fee.preciseUnitAmount,
    units: fee.units,
  }))
}
