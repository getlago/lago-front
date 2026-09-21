import { act, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { LagoApiError } from '~/generated/graphql'
import { AllTheProviders, render } from '~/test-utils'

import { ADD_METADATA_DRAWER_ADD_ROW_TEST_ID } from '../AddMetadataDrawerContent'
import { useAddMetadataDrawer } from '../useAddMetadataDrawer'

const SAVE_BUTTON_TEST_ID = 'submit'
const KEY_PLACEHOLDER = 'text_63fcc3218d35b9377840f5a7'
const VALUE_PLACEHOLDER = 'text_63fcc3218d35b9377840f5af'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
  shouldPromptOnClose?: () => boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()

// The NiceModal-backed drawer stack uses `import.meta`, which jest cannot parse.
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockUseGetInvoiceMetadataForEditionQuery = jest.fn()
const mockRefetchInvoiceMetadata = jest.fn()
const mockUpdateInvoiceMetadata = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceMetadataForEditionQuery: (...args: unknown[]) =>
    mockUseGetInvoiceMetadataForEditionQuery(...args),
  useUpdateInvoiceMetadataMutation: () => [mockUpdateInvoiceMetadata],
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

// jsdom does not implement scrollIntoView, used to reach the first invalid row
Element.prototype.scrollIntoView = jest.fn()

const INVOICE_ID = 'invoice-123'

const invoiceWithMetadata = (metadata: Array<{ id: string; key: string; value: string }>) => ({
  data: { invoice: { id: INVOICE_ID, metadata } },
  refetch: mockRefetchInvoiceMetadata,
})

const providersWrapper = ({ children }: { children: ReactNode }) => (
  <AllTheProviders>{children}</AllTheProviders>
)

const renderDrawerHook = (invoiceId: string | undefined = INVOICE_ID) =>
  renderHook(() => useAddMetadataDrawer({ invoiceId }), { wrapper: providersWrapper })

// A rejected submit only shows through the field error state: the drawer keeps
// `displayErrorText={false}`, so wait for it before asserting nothing was sent.
const expectSubmitRejected = async (rejectedFieldIndex: number): Promise<void> => {
  await waitFor(() => {
    expect(screen.getAllByRole('textbox')[rejectedFieldIndex]).toBeInvalid()
  })

  expect(mockUpdateInvoiceMetadata).not.toHaveBeenCalled()
}

// Mirrors BaseDrawer: the body and the actions live inside the <form> whose
// submit is the captured one, so the type="submit" button really submits.
const renderDrawerBody = () =>
  render(
    <form
      id={lastDrawerArgs?.form?.id}
      onSubmit={(event) => {
        event.preventDefault()
        lastDrawerArgs?.form?.submit()
      }}
    >
      {lastDrawerArgs?.children}
      {lastDrawerArgs?.mainAction}
    </form>,
  )

describe('useAddMetadataDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
    mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(invoiceWithMetadata([]))
    mockRefetchInvoiceMetadata.mockResolvedValue({ data: undefined })
    mockUpdateInvoiceMetadata.mockResolvedValue({ data: { updateInvoice: { id: 'invoice-123' } } })
  })

  describe('GIVEN an invoice id', () => {
    it('THEN should silence an expected not_found response from the metadata query', () => {
      renderDrawerHook()

      expect(mockUseGetInvoiceMetadataForEditionQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { id: 'invoice-123' },
          skip: false,
          context: { silentErrorCodes: [LagoApiError.NotFound] },
        }),
      )
    })
  })

  describe('GIVEN no invoice id', () => {
    it('THEN should skip the metadata query', () => {
      renderHook(() => useAddMetadataDrawer({ invoiceId: undefined }), {
        wrapper: providersWrapper,
      })

      expect(mockUseGetInvoiceMetadataForEditionQuery).toHaveBeenCalledWith(
        expect.objectContaining({ skip: true }),
      )
    })
  })

  describe('GIVEN an invoice without metadata', () => {
    it('THEN should open the drawer in creation mode', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(lastDrawerArgs?.title).toBe('text_6405cac5c833dcf18cacff2c')
      expect(lastDrawerArgs?.form?.id).toBe('add-metadata-drawer-form')
      expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
    })

    it('THEN should seed one empty row and label the button as creation', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toHaveTextContent(
        'text_6405cac5c833dcf18cacff4a',
      )
    })

    it('THEN should not submit while the seeded row is empty', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await expectSubmitRejected(0)
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('THEN should save the filled metadata and close the drawer', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.type(screen.getByPlaceholderText(KEY_PLACEHOLDER), 'purchase_order')
      await user.type(screen.getByPlaceholderText(VALUE_PLACEHOLDER), 'PO-42')
      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockUpdateInvoiceMetadata).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'invoice-123',
              metadata: [{ id: undefined, key: 'purchase_order', value: 'PO-42' }],
            },
          },
        })
      })
      expect(addToast).toHaveBeenCalledWith({
        message: 'text_6405cac5c833dcf18cad0204',
        severity: 'success',
      })
      expect(mockClose).toHaveBeenCalled()
    })

    it('THEN should append a row when the add button is clicked', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(ADD_METADATA_DRAWER_ADD_ROW_TEST_ID))

      expect(screen.getAllByRole('textbox')).toHaveLength(4)
    })

    it('THEN should prompt before closing once a pair has been typed', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)

      await user.type(screen.getByPlaceholderText(KEY_PLACEHOLDER), 'purchase_order')

      expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(true)
    })
  })

  describe('GIVEN the metadata query has not resolved yet', () => {
    // Opening before the query lands used to seed an empty form, so saving
    // replaced the pairs the invoice already had.
    it('THEN should fetch the metadata before seeding the drawer', async () => {
      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue({
        data: undefined,
        refetch: mockRefetchInvoiceMetadata,
      })
      mockRefetchInvoiceMetadata.mockResolvedValue(
        invoiceWithMetadata([{ id: 'metadata-1', key: 'purchase_order', value: 'PO-42' }]).data
          ? {
              data: {
                invoice: {
                  id: INVOICE_ID,
                  metadata: [{ id: 'metadata-1', key: 'purchase_order', value: 'PO-42' }],
                },
              },
            }
          : { data: undefined },
      )

      const { result } = renderDrawerHook()

      await act(async () => {
        await result.current.openDrawer()
      })
      renderDrawerBody()

      expect(mockRefetchInvoiceMetadata).toHaveBeenCalledTimes(1)
      expect(screen.getByDisplayValue('purchase_order')).toBeInTheDocument()
      expect(screen.getByDisplayValue('PO-42')).toBeInTheDocument()
    })

    it('THEN should still open the drawer when the metadata cannot be fetched', async () => {
      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue({
        data: undefined,
        refetch: mockRefetchInvoiceMetadata,
      })
      mockRefetchInvoiceMetadata.mockRejectedValue(new Error('offline'))

      const { result } = renderDrawerHook()

      await act(async () => {
        result.current.openDrawer()
      })
      renderDrawerBody()

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
    })
  })

  describe('GIVEN an invoice with existing metadata', () => {
    beforeEach(() => {
      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(
        invoiceWithMetadata([{ id: 'metadata-1', key: 'purchase_order', value: 'PO-42' }]),
      )
    })

    it('THEN should open the drawer in edition mode with the existing pairs', () => {
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      expect(lastDrawerArgs?.title).toBe('text_6405cac5c833dcf18cacff2a')
      expect(screen.getByDisplayValue('purchase_order')).toBeInTheDocument()
      expect(screen.getByDisplayValue('PO-42')).toBeInTheDocument()
      expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toHaveTextContent(
        'text_6405cac5c833dcf18cacffec',
      )
    })

    it('THEN should keep the metadata id so the API updates the existing pair', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.clear(screen.getByDisplayValue('PO-42'))
      await user.type(screen.getByPlaceholderText(VALUE_PLACEHOLDER), 'PO-43')
      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockUpdateInvoiceMetadata).toHaveBeenCalledWith({
          variables: {
            input: {
              id: 'invoice-123',
              metadata: [{ id: 'metadata-1', key: 'purchase_order', value: 'PO-43' }],
            },
          },
        })
      })
      expect(addToast).toHaveBeenCalledWith({
        message: 'text_6405cac5c833dcf18cad01fb',
        severity: 'success',
      })
    })

    it('THEN should remove a pair when its trash button is clicked', async () => {
      const user = userEvent.setup()
      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId('trash/medium'))

      expect(screen.queryByDisplayValue('purchase_order')).not.toBeInTheDocument()
    })

    it('THEN should keep the drawer open when the mutation fails', async () => {
      const user = userEvent.setup()

      mockUpdateInvoiceMetadata.mockResolvedValue({ errors: [new Error('nope')] })

      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockUpdateInvoiceMetadata).toHaveBeenCalledTimes(1)
      })
      expect(addToast).not.toHaveBeenCalled()
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN metadata sharing the same key', () => {
    it('THEN should not submit', async () => {
      const user = userEvent.setup()

      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(
        invoiceWithMetadata([
          { id: 'metadata-1', key: 'purchase_order', value: 'PO-42' },
          { id: 'metadata-2', key: 'purchase_order', value: 'PO-43' },
        ]),
      )

      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await expectSubmitRejected(0)
    })
  })

  describe('GIVEN a key longer than the allowed length', () => {
    it('THEN should not submit', async () => {
      const user = userEvent.setup()

      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(
        invoiceWithMetadata([{ id: 'metadata-1', key: 'a'.repeat(21), value: 'PO-42' }]),
      )

      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await expectSubmitRejected(0)
    })
  })

  describe('GIVEN a value longer than the allowed length', () => {
    it('THEN should not submit', async () => {
      const user = userEvent.setup()

      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(
        invoiceWithMetadata([{ id: 'metadata-1', key: 'purchase_order', value: 'a'.repeat(256) }]),
      )

      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await expectSubmitRejected(1)
    })
  })

  describe('GIVEN the maximum number of metadata', () => {
    it('THEN should disable the add button', () => {
      mockUseGetInvoiceMetadataForEditionQuery.mockReturnValue(
        invoiceWithMetadata(
          Array.from({ length: 5 }, (_, index) => ({
            id: `metadata-${index}`,
            key: `key-${index}`,
            value: `value-${index}`,
          })),
        ),
      )

      const { result } = renderDrawerHook()

      act(() => result.current.openDrawer())
      renderDrawerBody()

      expect(screen.getByTestId(ADD_METADATA_DRAWER_ADD_ROW_TEST_ID)).toBeDisabled()
    })
  })
})
