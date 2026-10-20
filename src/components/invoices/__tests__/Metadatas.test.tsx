import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Metadatas } from '~/components/invoices/Metadatas'
import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

const mockUseGetInvoiceMetadatasQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceMetadatasQuery: (...args: unknown[]) => mockUseGetInvoiceMetadatasQuery(...args),
}))

const mockOpenAddMetadataDrawer = jest.fn()
const mockUseAddMetadataDrawer = jest.fn()

jest.mock('~/components/invoices/addMetadataDrawer/useAddMetadataDrawer', () => ({
  useAddMetadataDrawer: (...args: unknown[]) => {
    mockUseAddMetadataDrawer(...args)

    return { openDrawer: mockOpenAddMetadataDrawer }
  },
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

    it('THEN should open the metadata drawer on the loaded invoice', async () => {
      mockUseGetInvoiceMetadatasQuery.mockReturnValue({
        data: { invoice: { id: 'invoice-123', metadata: [], customer: null } },
        loading: false,
      })

      render(<Metadatas />, { useParams: { invoiceId: 'invoice-123' } })

      expect(mockUseAddMetadataDrawer).toHaveBeenCalledWith({ invoiceId: 'invoice-123' })

      await userEvent.click(screen.getByRole('button', { name: 'Add metadata' }))

      expect(mockOpenAddMetadataDrawer).toHaveBeenCalledTimes(1)
    })
  })
})
