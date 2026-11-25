import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { MockLink } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useFinalizeInvoiceDialog } from '~/components/invoices/FinalizeInvoiceDialog'
import {
  GetInvoiceFeesDocument,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetInvoiceFeesQuery,
} from '~/generated/graphql'

const mockOpen = jest.fn()
const mockFinalize = jest.fn()
const mockRefetch = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ refetchQueries: mockRefetch }),
}))
jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen }),
}))
jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useFinalizeInvoiceMutation: () => [mockFinalize],
}))
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))
jest.mock('~/hooks/helpers/useFormatterDateHelper', () => ({
  useFormatterDateHelper: () => ({ formattedDateWithTimezone: jest.fn() }),
}))
jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

describe('GIVEN invoice finalization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRefetch.mockReset()
  })

  it.each([InvoiceStatusTypeEnum.Finalized, InvoiceStatusTypeEnum.Closed])(
    'THEN refetches the catalog queries only when the resulting invoice stays open (%s)',
    async (status) => {
      mockFinalize.mockResolvedValue({ data: { finalizeInvoice: { id: 'invoice-1', status } } })
      const callback = jest.fn()
      const { result } = renderHook(() => useFinalizeInvoiceDialog())

      act(() =>
        result.current.openFinalizeInvoiceDialog(
          {
            id: 'invoice-1',
            issuingDate: '2026-11-05',
            customer: { id: 'customer-1', applicableTimezone: TimezoneEnum.TzUtc },
          },
          callback,
        ),
      )
      await act(async () => mockOpen.mock.calls[0][0].onAction())
      expect(mockFinalize).toHaveBeenCalledWith({ variables: { input: { id: 'invoice-1' } } })
      if (status === InvoiceStatusTypeEnum.Closed) {
        expect(mockRefetch).toHaveBeenCalledWith({ include: ['getCustomerInvoices'] })
        expect(callback).toHaveBeenCalledTimes(1)
      } else {
        expect(mockRefetch).toHaveBeenCalledWith({
          include: [
            'getCustomerInvoices',
            'getInvoiceDetails',
            'getInvoiceFees',
            'getInvoiceProductCatalogContracts',
            'getInvoiceProductFees',
          ],
        })
        expect(callback).not.toHaveBeenCalled()
      }
    },
  )

  it.each([false, true])(
    'THEN updates active V1 fees after finalization and leaves catalog fees skipped (catalog: %s)',
    async (isCatalogInvoice) => {
      const feeResponse = (id: string, amountCents: string) => ({
        data: {
          invoice: {
            __typename: 'Invoice',
            id: 'invoice-1',
            fees: [{ __typename: 'Fee', id, amountCents }],
          },
        },
      })
      const initialFees = jest.fn(() => feeResponse('old-fee', '1000'))
      const finalizedFees = jest.fn(() => feeResponse('new-fee', '2000'))
      const client = new ApolloClient({
        cache: new InMemoryCache(),
        link: new MockLink(
          [initialFees, finalizedFees].map((result) => ({
            request: { query: GetInvoiceFeesDocument, variables: { id: 'invoice-1' } },
            result,
          })),
        ),
      })

      mockRefetch.mockImplementation((options) => client.refetchQueries(options))
      mockFinalize.mockResolvedValue({
        data: { finalizeInvoice: { id: 'invoice-1', status: InvoiceStatusTypeEnum.Finalized } },
      })
      const { result, unmount } = renderHook(
        () => ({
          dialog: useFinalizeInvoiceDialog(),
          fees: useGetInvoiceFeesQuery({
            variables: { id: 'invoice-1' },
            skip: isCatalogInvoice,
            fetchPolicy: 'network-only',
          }),
        }),
        { wrapper: ({ children }) => <ApolloProvider client={client}>{children}</ApolloProvider> },
      )

      if (!isCatalogInvoice) {
        await waitFor(() =>
          expect(result.current.fees.data?.invoice?.fees?.[0]).toMatchObject({
            id: 'old-fee',
            amountCents: '1000',
          }),
        )
      }
      act(() =>
        result.current.dialog.openFinalizeInvoiceDialog({
          id: 'invoice-1',
          issuingDate: '2026-11-05',
          customer: { id: 'customer-1', applicableTimezone: TimezoneEnum.TzUtc },
        }),
      )
      await act(async () => {
        await mockOpen.mock.calls[0][0].onAction()
        await mockRefetch.mock.results[0].value
      })
      if (isCatalogInvoice) {
        expect(initialFees).not.toHaveBeenCalled()
        expect(finalizedFees).not.toHaveBeenCalled()
        expect(result.current.fees.data).toBeUndefined()
      } else {
        await waitFor(() =>
          expect(result.current.fees.data?.invoice?.fees?.[0]).toMatchObject({
            id: 'new-fee',
            amountCents: '2000',
          }),
        )
        expect(finalizedFees).toHaveBeenCalledTimes(1)
      }
      unmount()
      client.stop()
    },
  )
})
