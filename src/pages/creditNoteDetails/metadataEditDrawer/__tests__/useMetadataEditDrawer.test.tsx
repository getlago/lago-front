import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { addToast } from '~/core/apolloClient'
import { CurrencyEnum, GetCreditNoteForDetailsQuery } from '~/generated/graphql'
import { render } from '~/test-utils'

import { ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID } from '../MetadataEditDrawerContent'
import { METADATA_EDIT_DRAWER_SAVE_TEST_ID, useMetadataEditDrawer } from '../useMetadataEditDrawer'

const LABELS: Record<string, string> = {
  text_176466851340792f3wzvqvb8: 'Edit Metadata',
  text_1764684767320qeu0x6az165: 'Save edits',
  text_1764753433918x3icklnboak: 'Metadata key is required',
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, variables?: Record<string, string | number>) => {
      const label = LABELS[key] ?? key

      if (!variables) return label

      return Object.entries(variables).reduce(
        (acc, name) => acc.replace(`{{${name[0]}}}`, String(name[1])),
        label,
      )
    },
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockUpdateCreditNote = jest.fn()

jest.mock('../useEditCreditNote', () => ({
  useEditCreditNote: () => ({
    updateCreditNote: mockUpdateCreditNote,
    isUpdatingCreditNote: false,
  }),
}))

type DrawerConfig = {
  title: string
  children: ReactNode
  mainAction: ReactNode
  form: { id: string; submit: () => void }
  closeOnSubmitSuccess?: boolean
  shouldPromptOnClose?: () => boolean
  onClose?: () => void
}

let capturedConfig: DrawerConfig | undefined
const mockOpen = jest.fn((config: DrawerConfig) => {
  capturedConfig = config

  return Promise.resolve({ reason: 'close' })
})
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

type CreditNote = GetCreditNoteForDetailsQuery['creditNote']

const createCreditNote = (metadata: Array<{ key: string; value: string }> = []): CreditNote => ({
  id: 'credit-note-123',
  number: 'CN-001',
  canBeVoided: true,
  totalAmountCents: '10000',
  creditAmountCents: '5000',
  refundAmountCents: '5000',
  offsetAmountCents: '0',
  currency: CurrencyEnum.Usd,
  integrationSyncable: false,
  taxProviderSyncable: false,
  externalIntegrationId: null,
  taxProviderId: null,
  xmlUrl: null,
  refundStatus: null,
  metadata,
  billingEntity: {
    id: 'billing-entity-1',
    einvoicing: false,
    name: 'Billing',
    logoUrl: null,
  },
  customer: {
    id: 'customer-1',
    email: 'customer@example.com',
    netsuiteCustomer: null,
    xeroCustomer: null,
    anrokCustomer: null,
    avalaraCustomer: null,
  },
})

const scrollIntoViewMock = jest.fn()

Element.prototype.scrollIntoView = scrollIntoViewMock

const OPEN_BUTTON_TEST_ID = 'host-open-drawer'

const Host = ({ creditNote }: { creditNote: CreditNote }) => {
  const { openDrawer } = useMetadataEditDrawer({ creditNote })

  return (
    <button type="button" data-test={OPEN_BUTTON_TEST_ID} onClick={openDrawer}>
      open
    </button>
  )
}

const CapturedDrawer = () => (
  <form
    id={capturedConfig?.form.id}
    onSubmit={(event) => {
      event.preventDefault()
      capturedConfig?.form.submit()
    }}
  >
    {capturedConfig?.children}
    {capturedConfig?.mainAction}
  </form>
)

const openDrawerFor = async (creditNote: CreditNote): Promise<void> => {
  const user = userEvent.setup()

  render(<Host creditNote={creditNote} />)

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  render(<CapturedDrawer />)
}

describe('useMetadataEditDrawer', () => {
  beforeEach(() => {
    capturedConfig = undefined
    jest.clearAllMocks()
    mockUpdateCreditNote.mockResolvedValue({
      data: { updateCreditNote: { id: 'credit-note-123' } },
    })
  })

  describe('GIVEN the hook is mounted', () => {
    describe('WHEN openDrawer is called', () => {
      it('THEN should open the form drawer', async () => {
        const user = userEvent.setup()

        render(<Host creditNote={createCreditNote()} />)

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

        expect(mockOpen).toHaveBeenCalledTimes(1)
      })

      it('THEN should let its own onSubmit decide when to close', async () => {
        const user = userEvent.setup()

        render(<Host creditNote={createCreditNote()} />)

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

        expect(capturedConfig?.closeOnSubmitSuccess).toBe(false)
      })

      it('THEN should prompt on close only once the form is dirty', async () => {
        const user = userEvent.setup()

        render(<Host creditNote={createCreditNote()} />)
        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))
        render(<CapturedDrawer />)

        expect(capturedConfig?.shouldPromptOnClose?.()).toBe(false)

        await user.click(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID))

        expect(capturedConfig?.shouldPromptOnClose?.()).toBe(true)
      })
    })
  })

  describe('GIVEN the credit note already carries metadata', () => {
    describe('WHEN the drawer opens', () => {
      it.each([
        ['first key', 'order_id'],
        ['first value', 'ORD-12345'],
        ['second key', 'department'],
        ['second value', 'Sales'],
      ])('THEN should seed the %s input', async (_, value) => {
        await openDrawerFor(
          createCreditNote([
            { key: 'order_id', value: 'ORD-12345' },
            { key: 'department', value: 'Sales' },
          ]),
        )

        expect(screen.getByDisplayValue(value)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the form is submitted', () => {
    describe('WHEN the metadata is valid', () => {
      it('THEN should send only the key and value of each row', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(mockUpdateCreditNote).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'credit-note-123',
                metadata: [{ key: 'order_id', value: 'ORD-12345' }],
              },
            },
          })
        })
      })

      it('THEN should show a success toast', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
      })

      it('THEN should close the drawer', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(mockClose).toHaveBeenCalledTimes(1)
        })
      })

      it('THEN should submit when pressing enter inside an input', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.type(screen.getByDisplayValue('ORD-12345'), '{enter}')

        await waitFor(() => {
          expect(mockUpdateCreditNote).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('WHEN the mutation returns errors', () => {
      beforeEach(() => {
        mockUpdateCreditNote.mockResolvedValue({ errors: [new Error('nope')] })
      })

      it('THEN should not show a success toast', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(mockUpdateCreditNote).toHaveBeenCalledTimes(1)
        })
        expect(addToast).not.toHaveBeenCalled()
      })

      it('THEN should keep the drawer open', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote([{ key: 'order_id', value: 'ORD-12345' }]))

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(mockUpdateCreditNote).toHaveBeenCalledTimes(1)
        })
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a row is invalid', () => {
      it('THEN should scroll the first errored input into view', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote())

        await user.click(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID))
        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(scrollIntoViewMock).toHaveBeenCalled()
        })

        const scrolled = scrollIntoViewMock.mock.contexts[0] as HTMLElement

        expect(scrolled.getAttribute('name')).toBe('metadata[0].key')
      })

      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        await openDrawerFor(createCreditNote())

        await user.click(screen.getByTestId(ADD_CREDIT_NOTE_METADATA_ROW_TEST_ID))
        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(screen.getByText(LABELS.text_1764753433918x3icklnboak)).toBeInTheDocument()
        })
        expect(mockUpdateCreditNote).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN there is no credit note', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        await openDrawerFor(undefined)

        await user.click(screen.getByTestId(METADATA_EDIT_DRAWER_SAVE_TEST_ID))

        await waitFor(() => {
          expect(mockOpen).toHaveBeenCalledTimes(1)
        })
        expect(mockUpdateCreditNote).not.toHaveBeenCalled()
      })
    })
  })
})
