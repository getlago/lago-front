import { screen } from '@testing-library/react'

import { Metadatas } from '~/components/invoices/Metadatas'
import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

const mockUseGetInvoiceMetadatasQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceMetadatasQuery: (...args: unknown[]) => mockUseGetInvoiceMetadatasQuery(...args),
}))

jest.mock('~/components/invoices/AddMetadataDrawer', () => ({
  AddMetadataDrawer: () => null,
}))

describe('Metadatas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetInvoiceMetadatasQuery.mockReturnValue({ data: undefined, loading: false })
  })

  describe('GIVEN a route without an invoiceId param', () => {
    it('THEN should skip the query instead of fetching an empty id', () => {
      render(<Metadatas />, { useParams: {} })

      expect(mockUseGetInvoiceMetadatasQuery).toHaveBeenCalledWith(
        expect.objectContaining({ skip: true }),
      )
    })
  })

  describe('GIVEN an invoiceId param', () => {
    it('THEN should fetch the invoice metadata and render it', () => {
      mockUseGetInvoiceMetadatasQuery.mockReturnValue({
        data: {
          invoice: {
            id: 'invoice-123',
            metadata: [{ id: 'metadata-1', key: 'Purchase order', value: 'PO-42' }],
            customer: {
              id: 'customer-123',
              metadata: [
                {
                  id: 'metadata-2',
                  key: 'Cost center',
                  value: 'CC-7',
                  displayInInvoice: true,
                },
                {
                  id: 'metadata-3',
                  key: 'Hidden',
                  value: 'Not displayed',
                  displayInInvoice: false,
                },
              ],
            },
          },
        },
        loading: false,
      })

      render(<Metadatas />, { useParams: { invoiceId: 'invoice-123' } })

      expect(mockUseGetInvoiceMetadatasQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 'invoice-123' },
          skip: false,
          context: { silentErrorCodes: [LagoApiError.NotFound] },
        }),
      )
      expect(screen.getByText('Purchase order')).toBeInTheDocument()
      expect(screen.getByText('PO-42')).toBeInTheDocument()
      expect(screen.getByText('Cost center')).toBeInTheDocument()
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    })
  })
})
