import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, ReactNode } from 'react'

import { render } from '~/test-utils'

import { ItemMetadataDrawer, ItemMetadataDrawerRef } from '../ItemMetadataDrawer'

const SAVE_BUTTON_TEST_ID = 'item-metadata-drawer-save'

// Readable labels keyed by the real translation keys the component uses, so
// assertions never reference raw translation keys.
const LABELS: Record<string, string> = {
  text_63fcc3218d35b9377840f59b: 'Metadata', // title / add
  text_6405cac5c833dcf18cad0196: 'Add metadata', // save label (add mode)
  text_17295436903260tlyb1gp1i7: 'Save', // save label (edit mode)
  text_1784637373017e1som6d92em: 'Delete all',
  text_6411e6b530cb47007488b027: 'Cancel',
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => LABELS[key] ?? key,
  }),
}))

// ── Drawer mock: capture the open() config so we can render its children +
// actions and drive the real form living inside the component ──────────────
type DrawerConfig = {
  title: string
  children: ReactNode
  mainAction: ReactNode
  secondaryAction?: ReactNode
  form: { id: string; submit: () => void }
  onEntered?: (container: HTMLElement) => void
}
let capturedConfig: DrawerConfig | undefined
const mockOpen = jest.fn((config: DrawerConfig) => {
  capturedConfig = config
})
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

// Mirrors BaseDrawer: children + actions live inside the <form> whose submit
// is the captured form.submit, so the type="submit" SubmitButton works.
const CapturedDrawer = () => (
  <form
    id={capturedConfig?.form.id}
    onSubmit={(e) => {
      e.preventDefault()
      capturedConfig?.form.submit()
    }}
  >
    {capturedConfig?.children}
    {capturedConfig?.secondaryAction}
    {capturedConfig?.mainAction}
  </form>
)

describe('ItemMetadataDrawer', () => {
  beforeEach(() => {
    capturedConfig = undefined
    mockOpen.mockClear()
    mockClose.mockClear()
  })

  const renderDrawer = ({
    onSave = jest.fn(),
    onDelete,
  }: {
    onSave?: jest.Mock
    onDelete?: jest.Mock
  } = {}) => {
    const ref = createRef<ItemMetadataDrawerRef>()

    render(
      <ItemMetadataDrawer
        ref={ref}
        description="Store pairs on this plan."
        onSave={onSave}
        onDelete={onDelete}
      />,
    )

    return { ref, onSave, onDelete }
  }

  describe('GIVEN the drawer is opened in add mode (no values)', () => {
    it('THEN should open the drawer with a title', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer())

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(capturedConfig?.title).toBe('Metadata')
    })

    it('THEN should seed one empty row', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer())
      render(<CapturedDrawer />)

      expect(screen.getAllByRole('textbox')).toHaveLength(2)
    })

    it('THEN should label the save button as add', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer())
      render(<CapturedDrawer />)

      expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toHaveTextContent('Add metadata')
    })

    it('THEN should not render the delete button', () => {
      const { ref } = renderDrawer({ onDelete: jest.fn() })

      act(() => ref.current?.openDrawer())
      render(<CapturedDrawer />)

      expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the drawer is opened in edit mode (with values)', () => {
    const values = { metadata: [{ key: 'product_group', value: 'Premium Suite' }] }

    it('THEN should prefill the existing pair', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      expect(screen.getByDisplayValue('product_group')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Premium Suite')).toBeInTheDocument()
    })

    it('THEN should label the save button as edit', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toHaveTextContent('Save')
    })

    it('THEN should render the delete button when onDelete is provided', () => {
      const { ref } = renderDrawer({ onDelete: jest.fn() })

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      expect(screen.getByRole('button', { name: 'Delete all' })).toBeInTheDocument()
    })
  })

  describe('GIVEN a valid edit and the save button is clicked', () => {
    const values = { metadata: [{ key: 'product_group', value: 'Premium Suite' }] }

    it('THEN should call onSave with the metadata and close the drawer', async () => {
      const user = userEvent.setup()
      const { ref, onSave } = renderDrawer({ onSave: jest.fn() })

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(values)
      })
      expect(mockClose).toHaveBeenCalled()
    })

    it('THEN should keep the drawer open when onSave returns false', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn(() => false)
      const { ref } = renderDrawer({ onSave })

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1)
      })
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN an invalid add and the save button is clicked', () => {
    it('THEN should not call onSave (validation blocks submission)', async () => {
      const user = userEvent.setup()
      const { ref, onSave } = renderDrawer({ onSave: jest.fn() })

      // add mode seeds one empty row → required key/value fail validation
      act(() => ref.current?.openDrawer())
      render(<CapturedDrawer />)

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      expect(onSave).not.toHaveBeenCalled()
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the drawer is opened with appendEmptyRow', () => {
    const values = { metadata: [{ key: 'product_group', value: 'Premium Suite' }] }

    it('THEN should append one empty ready-to-type row after the existing pairs', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer(values, { appendEmptyRow: true }))
      render(<CapturedDrawer />)

      // 1 existing pair + 1 empty row → 4 textboxes
      expect(screen.getAllByRole('textbox')).toHaveLength(4)
      expect(screen.getByDisplayValue('product_group')).toBeInTheDocument()
    })

    it('THEN should block the save with a validation error when the appended row is left empty', async () => {
      const user = userEvent.setup()
      const { ref, onSave } = renderDrawer({ onSave: jest.fn() })

      act(() => ref.current?.openDrawer(values, { appendEmptyRow: true }))
      render(<CapturedDrawer />)

      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      expect(onSave).not.toHaveBeenCalled()
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('THEN should focus the key input of the appended row once the drawer is entered', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer(values, { appendEmptyRow: true }))
      render(<CapturedDrawer />)

      act(() => capturedConfig?.onEntered?.(document.body))

      // Last key input = the appended empty row
      const keyInputs = document.querySelectorAll<HTMLInputElement>('input[id$=".key"]')

      expect(keyInputs[keyInputs.length - 1]).toHaveFocus()
    })

    it('THEN should not steal the focus when opened from the Edit action', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.openDrawer(values))
      render(<CapturedDrawer />)

      act(() => capturedConfig?.onEntered?.(document.body))

      const keyInputs = document.querySelectorAll<HTMLInputElement>('input[id$=".key"]')

      expect(keyInputs[keyInputs.length - 1]).not.toHaveFocus()
    })

    it('THEN should save all pairs once the appended row is filled', async () => {
      const user = userEvent.setup()
      const { ref, onSave } = renderDrawer({ onSave: jest.fn() })

      act(() => ref.current?.openDrawer(values, { appendEmptyRow: true }))
      render(<CapturedDrawer />)

      const [, , emptyKey, emptyValue] = screen.getAllByRole('textbox')

      await user.type(emptyKey, 'tier')
      await user.type(emptyValue, 'Gold')
      await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          metadata: [...values.metadata, { key: 'tier', value: 'Gold' }],
        })
      })
      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('GIVEN the delete button is clicked', () => {
    it('THEN should call onDelete and close the drawer once it settles', async () => {
      const user = userEvent.setup()
      const onDelete = jest.fn(() => Promise.resolve(true))
      const { ref } = renderDrawer({ onDelete })

      act(() => ref.current?.openDrawer({ metadata: [{ key: 'k', value: 'v' }] }))
      render(<CapturedDrawer />)

      await user.click(screen.getByRole('button', { name: 'Delete all' }))

      expect(onDelete).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
      })
    })

    it('THEN should keep the drawer open when onDelete returns false', async () => {
      const user = userEvent.setup()
      const onDelete = jest.fn(() => Promise.resolve(false))
      const { ref } = renderDrawer({ onDelete })

      act(() => ref.current?.openDrawer({ metadata: [{ key: 'k', value: 'v' }] }))
      render(<CapturedDrawer />)

      await user.click(screen.getByRole('button', { name: 'Delete all' }))

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledTimes(1)
      })
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN closeDrawer is called imperatively', () => {
    it('THEN should close the drawer', () => {
      const { ref } = renderDrawer()

      act(() => ref.current?.closeDrawer())

      expect(mockClose).toHaveBeenCalled()
    })
  })
})
