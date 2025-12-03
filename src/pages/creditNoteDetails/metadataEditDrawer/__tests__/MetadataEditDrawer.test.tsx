import { cleanup } from '@testing-library/react'
import { createRef } from 'react'

import { CurrencyEnum, GetCreditNoteForDetailsQuery } from '~/generated/graphql'
import { render } from '~/test-utils'

import { MetadataEditDrawer, MetadataEditDrawerRef } from '../MetadataEditDrawer'

const mockUpdateCreditNote = jest.fn()

jest.mock('../useEditCreditNote', () => ({
  useEditCreditNote: () => ({
    updateCreditNote: mockUpdateCreditNote,
    isUpdatingCreditNote: false,
  }),
}))

type CreditNoteType = GetCreditNoteForDetailsQuery['creditNote']

const createMockCreditNote = (
  metadata: Array<{ key: string; value: string }> = [],
): CreditNoteType => ({
  id: 'credit-note-123',
  number: 'CN-001',
  canBeVoided: true,
  totalAmountCents: '10000',
  currency: CurrencyEnum.Usd,
  integrationSyncable: false,
  taxProviderSyncable: false,
  externalIntegrationId: null,
  taxProviderId: null,
  xmlUrl: null,
  refundStatus: null,
  metadata,
  billingEntity: {
    einvoicing: false,
  },
  customer: {
    netsuiteCustomer: null,
    xeroCustomer: null,
    anrokCustomer: null,
    avalaraCustomer: null,
  },
})

describe('MetadataEditDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateCreditNote.mockResolvedValue({
      data: { updateCreditNote: { id: 'credit-note-123' } },
    })
  })

  afterEach(cleanup)

  describe('drawer ref methods', () => {
    it('exposes openDrawer method via ref', () => {
      const ref = createRef<MetadataEditDrawerRef>()

      render(<MetadataEditDrawer ref={ref} />)

      expect(ref.current?.openDrawer).toBeDefined()
      expect(typeof ref.current?.openDrawer).toBe('function')
    })

    it('exposes closeDrawer method via ref', () => {
      const ref = createRef<MetadataEditDrawerRef>()

      render(<MetadataEditDrawer ref={ref} />)

      expect(ref.current?.closeDrawer).toBeDefined()
      expect(typeof ref.current?.closeDrawer).toBe('function')
    })

    it('can call openDrawer without error', () => {
      const ref = createRef<MetadataEditDrawerRef>()
      const creditNote = createMockCreditNote()

      render(<MetadataEditDrawer ref={ref} />)

      expect(() => {
        ref.current?.openDrawer({ creditNote })
      }).not.toThrow()
    })

    it('can call closeDrawer without error', () => {
      const ref = createRef<MetadataEditDrawerRef>()

      render(<MetadataEditDrawer ref={ref} />)

      expect(() => {
        ref.current?.closeDrawer()
      }).not.toThrow()
    })
  })

  describe('snapshots', () => {
    it('matches snapshot when closed', () => {
      const ref = createRef<MetadataEditDrawerRef>()

      const { container } = render(<MetadataEditDrawer ref={ref} />)

      expect(container).toMatchSnapshot()
    })
  })
})
