import { Invoice, InvoiceTypeEnum } from '~/generated/graphql'

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
