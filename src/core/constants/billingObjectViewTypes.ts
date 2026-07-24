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
