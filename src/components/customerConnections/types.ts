/**
 * The four customer-connection categories billing objects route to.
 * Mirrors the backend connection categories (payment / tax / accounting / CRM).
 */
export enum ConnectionCategory {
  Payment = 'payment',
  Accounting = 'accounting',
  Tax = 'tax',
  Crm = 'crm',
}

export const CONNECTION_CATEGORY_LABEL_KEYS: Record<ConnectionCategory, string> = {
  [ConnectionCategory.Payment]: 'text_634ea0ecc6147de10ddb6631',
  [ConnectionCategory.Accounting]: 'text_66423cad72bbad009f2f568f',
  [ConnectionCategory.Tax]: 'text_6668821d94e4da4dfd8b3840',
  [ConnectionCategory.Crm]: 'text_1728658962985xpfdvl5ru8a',
}

/** Short category labels (list Type chips): Payment / Accounting / Tax / CRM */
export const CONNECTION_CATEGORY_SHORT_LABEL_KEYS: Record<ConnectionCategory, string> = {
  [ConnectionCategory.Payment]: 'text_6419c64eace749372fc72b40',
  [ConnectionCategory.Accounting]: 'text_661ff6e56ef7e1b7c542b245',
  [ConnectionCategory.Tax]: 'text_6453819268763979024ad0e9',
  [ConnectionCategory.Crm]: 'text_1727189568053q2gpkjzpmxr',
}

/** Title shown above the locked connection Selector (edit mode) */
export const CONNECTION_CATEGORY_SELECT_TITLE_KEYS: Record<ConnectionCategory, string> = {
  [ConnectionCategory.Payment]: 'text_17845400557039mygcsig4ny',
  [ConnectionCategory.Accounting]: 'text_1784540055704pgpqnpvkgw3',
  [ConnectionCategory.Tax]: 'text_1784540055704fe0ekxa7yfh',
  [ConnectionCategory.Crm]: 'text_1784540055704s7odgggdp3j',
}
