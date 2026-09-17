import { LagoApiError } from '~/generated/graphql'
import { render } from '~/test-utils'

import { AddMetadataDrawer } from '../AddMetadataDrawer'

const mockUseGetInvoiceMetadataForEditionQuery = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceMetadataForEditionQuery: (...args: unknown[]) =>
    mockUseGetInvoiceMetadataForEditionQuery(...args),
  useUpdateInvoiceMetadataMutation: () => [jest.fn()],
}))

describe('AddMetadataDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue({ data: undefined })
  })

  describe('GIVEN an invoice id', () => {
    it('THEN should silence an expected not_found response from the metadata query', () => {
      render(<AddMetadataDrawer invoiceId="invoice-123" />)

      expect(mockUseGetInvoiceMetadataForEditionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 'invoice-123' },
          skip: false,
          context: { silentErrorCodes: [LagoApiError.NotFound] },
        }),
      )
    })
  })
})
