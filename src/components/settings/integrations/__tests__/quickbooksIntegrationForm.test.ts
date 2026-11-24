import { QuickbooksForCreateDialogFragment } from '~/generated/graphql'

import {
  DEFAULT_QUICKBOOKS_FORM_VALUES,
  getQuickbooksFormValues,
  quickbooksFormValidationSchema,
} from '../quickbooksIntegrationForm'

const provider: QuickbooksForCreateDialogFragment = {
  __typename: 'QuickbooksIntegration',
  id: 'quickbooks-id',
  name: 'QuickBooks US',
  code: 'quickbooks_us',
  connectionId: 'connection-id',
  sandbox: true,
  syncCreditNotes: false,
  syncInvoices: true,
  syncPayments: null,
}

describe('getQuickbooksFormValues', () => {
  describe('GIVEN no connection', () => {
    it('THEN returns the empty form', () => {
      expect(getQuickbooksFormValues(undefined)).toEqual(DEFAULT_QUICKBOOKS_FORM_VALUES)
    })
  })

  describe('GIVEN an existing connection', () => {
    it('THEN returns its values, with missing flags off', () => {
      expect(getQuickbooksFormValues(provider)).toEqual({
        name: 'QuickBooks US',
        code: 'quickbooks_us',
        sandbox: true,
        syncCreditNotes: false,
        syncInvoices: true,
        syncPayments: false,
      })
    })
  })
})

describe('quickbooksFormValidationSchema', () => {
  it('THEN rejects a blank name or code', () => {
    const result = quickbooksFormValidationSchema.safeParse(DEFAULT_QUICKBOOKS_FORM_VALUES)

    expect(result.success).toBe(false)
    expect(result.error?.issues.map(({ path }) => path[0])).toEqual(['name', 'code'])
  })

  it('THEN accepts a named connection', () => {
    const result = quickbooksFormValidationSchema.safeParse({
      ...DEFAULT_QUICKBOOKS_FORM_VALUES,
      name: 'QuickBooks',
      code: 'quickbooks',
    })

    expect(result.success).toBe(true)
  })
})
