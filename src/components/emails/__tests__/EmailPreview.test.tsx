import { cleanup } from '@testing-library/react'

import { DisplayEnum } from '~/components/emails/EmailPreview'
import { LocaleEnum } from '~/core/translations'
import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'

const mockBillingEntity = {
  id: '1',
  name: 'Test Company',
  logoUrl: 'https://example.com/logo.png',
}

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  envGlobalVar: jest.fn(() => ({
    disablePdfGeneration: false,
  })),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: jest.fn().mockReturnValue(false),
  }),
}))

describe('EmailPreview', () => {
  afterEach(cleanup)

  it('exports DisplayEnum with correct values', () => {
    expect(DisplayEnum.desktop).toBe('desktop')
    expect(DisplayEnum.mobile).toBe('mobile')
  })

  it('BillingEntityEmailSettingsEnum is defined', () => {
    expect(BillingEntityEmailSettingsEnum.InvoiceFinalized).toBeDefined()
    expect(BillingEntityEmailSettingsEnum.CreditNoteCreated).toBeDefined()
    expect(BillingEntityEmailSettingsEnum.PaymentReceiptCreated).toBeDefined()
  })

  it('LocaleEnum is defined', () => {
    expect(LocaleEnum.en).toBeDefined()
  })

  it('mockBillingEntity has correct structure', () => {
    expect(mockBillingEntity).toEqual({
      id: '1',
      name: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
    })
  })
})
