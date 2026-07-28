// Billing objects that mount the per-object payment & invoicing settings
// (drawers, field components, summaries). Each surface carries its own
// parametric copy via VIEW_TYPE_TRANSLATION_KEYS.
export enum ViewTypeEnum {
  Subscription = 'subscription',
  WalletTopUp = 'walletTopUp',
  WalletRecurringTopUp = 'walletRecurringTopUp',
  WalletTransactionTopUp = 'walletTransactionTopUp',
  OneOffInvoice = 'oneOffInvoice',
}

export const VIEW_TYPE_TRANSLATION_KEYS: Record<ViewTypeEnum, string> = {
  [ViewTypeEnum.Subscription]: 'text_1764327933607nrezuuiheuc',
  [ViewTypeEnum.WalletTopUp]: 'text_1765895170354ovelm7g07o4',
  [ViewTypeEnum.WalletRecurringTopUp]: 'text_1765959116589recur1ngrul',
  [ViewTypeEnum.WalletTransactionTopUp]: 'text_17659678187872em8xoix499',
  [ViewTypeEnum.OneOffInvoice]: 'text_1766405484863ts63ubynxt3',
}

// Full-sentence captions under the "Invoicing settings" / "Payments apps and
// settings" headings (form sections + drawer titles). Per-view sentences, not
// a parametric template: the wallet-scoped surfaces phrase around "the wallet
// [...] invoices" while the others phrase around the object itself.
export const VIEW_TYPE_INVOICING_CAPTION_KEYS: Record<ViewTypeEnum, string> = {
  [ViewTypeEnum.Subscription]: 'text_1782738644346p066xtwa8yj',
  [ViewTypeEnum.WalletTopUp]: 'text_1785164421080mvdaqb17yzp',
  [ViewTypeEnum.WalletRecurringTopUp]: 'text_17851644210806680b9rdlpa',
  [ViewTypeEnum.WalletTransactionTopUp]: 'text_17851644210809yu9jgh0zsr',
  [ViewTypeEnum.OneOffInvoice]: 'text_1785164421080j4ohbewttiq',
}

export const VIEW_TYPE_PAYMENT_CAPTION_KEYS: Record<ViewTypeEnum, string> = {
  [ViewTypeEnum.Subscription]: 'text_17828013737955532qxu3wq4',
  [ViewTypeEnum.WalletTopUp]: 'text_1785164421080e3ku2v2stj6',
  [ViewTypeEnum.WalletRecurringTopUp]: 'text_1785164421080tk7v5844l7t',
  [ViewTypeEnum.WalletTransactionTopUp]: 'text_1785164421080k7xsvr02s6q',
  [ViewTypeEnum.OneOffInvoice]: 'text_17851644210801zgw4bfuqv5',
}
