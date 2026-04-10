export enum QuoteStatusEnum {
  draft = 'draft',
  approved = 'approved',
  voided = 'voided',
}

export enum QuoteOrderTypeEnum {
  subscriptionCreation = 'subscription_creation',
  subscriptionAmendment = 'subscription_amendment',
  oneOff = 'one_off',
}

export enum QuoteDefaultExecutionModeEnum {
  executeInLago = 'execute_in_lago',
  orderOnly = 'order_only',
}

export enum QuoteBackdatedBillingEnum {
  generatePastInvoices = 'generate_past_invoices',
  startWithoutInvoices = 'start_without_invoices',
}

export interface QuoteContact {
  id: string
  name: string
  email: string
  company: string | null
  role: string | null
  position: number
}

export interface QuoteMetadataEntry {
  key: string
  value: string
}

export interface Quote {
  __typename: 'Quote'
  id: string
  organizationId: string
  customer: {
    id: string
    name: string
    externalId: string
  }
  templateId: string | null
  number: string
  version: number
  status: QuoteStatusEnum
  orderType: QuoteOrderTypeEnum
  currency: string | null
  description: string | null
  validForDays: number | null
  billingItems: Record<string, unknown> | null
  commercialTerms: Record<string, unknown> | null
  richTextContent: string | null
  legalText: string | null
  internalNotes: string | null
  contacts: QuoteContact[]
  metadata: QuoteMetadataEntry[] | null
  autoExecute: boolean
  defaultExecutionMode: QuoteDefaultExecutionModeEnum | null
  backdatedBilling: QuoteBackdatedBillingEnum | null
  internalShareToken: string | null
  approvedAt: string | null
  voidedAt: string | null
  voidedReason: string | null
  createdAt: string
  updatedAt: string
  owners: Array<{
    id: string
    name: string
    email: string
  }>
}
