import { z } from 'zod'

import { QuickbooksForCreateDialogFragment } from '~/generated/graphql'

export type AddQuickbooksFormValues = {
  name: string
  code: string
  sandbox: boolean
  syncCreditNotes: boolean
  syncInvoices: boolean
  syncPayments: boolean
}

type OptionalSyncedObject = {
  name: keyof Pick<AddQuickbooksFormValues, 'syncCreditNotes' | 'syncInvoices' | 'syncPayments'>
  objectKey: string
}

// Accounts, customers and items always sync; the rest is the user's choice.
export const ALWAYS_SYNCED_OBJECT_KEYS = [
  'text_661ff6e56ef7e1b7c542b2a6',
  'text_661ff6e56ef7e1b7c542b2c2',
  'text_661ff6e56ef7e1b7c542b2d7',
]

export const OPTIONAL_SYNCED_OBJECTS: OptionalSyncedObject[] = [
  { name: 'syncCreditNotes', objectKey: 'text_661ff6e56ef7e1b7c542b2e9' },
  { name: 'syncInvoices', objectKey: 'text_661ff6e56ef7e1b7c542b2ff' },
  { name: 'syncPayments', objectKey: 'text_661ff6e56ef7e1b7c542b311' },
]

export const DEFAULT_QUICKBOOKS_FORM_VALUES: AddQuickbooksFormValues = {
  name: '',
  code: '',
  sandbox: false,
  syncCreditNotes: false,
  syncInvoices: false,
  syncPayments: false,
}

export const quickbooksFormValidationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  sandbox: z.boolean(),
  syncCreditNotes: z.boolean(),
  syncInvoices: z.boolean(),
  syncPayments: z.boolean(),
})

export const getQuickbooksFormValues = (
  provider: QuickbooksForCreateDialogFragment | undefined,
): AddQuickbooksFormValues => {
  if (!provider) return DEFAULT_QUICKBOOKS_FORM_VALUES

  return {
    name: provider.name || '',
    code: provider.code || '',
    sandbox: !!provider.sandbox,
    syncCreditNotes: !!provider.syncCreditNotes,
    syncInvoices: !!provider.syncInvoices,
    syncPayments: !!provider.syncPayments,
  }
}
