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
