import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'
import { render } from '~/test-utils'

import {
  EDIT_ICS_DIALOG_APPLY_RADIO_TEST_ID,
  EDIT_ICS_DIALOG_FALLBACK_RADIO_TEST_ID,
  EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID,
  EditInvoiceCustomSectionDialog,
  InvoiceCustomSectionBehavior,
} from '../EditInvoiceCustomSectionDialog'
import { InvoiceCustomSectionBasic } from '../types'

jest.mock('~/hooks/useInvoiceCustomSections', () => ({
  useInvoiceCustomSections: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, params?: { object?: string }) => {
      if (params?.object) {
        return `${key} with ${params.object}`
      }
      return key
    },
    locale: 'en',
  }),
}))

const mockUseInvoiceCustomSections = jest.mocked(useInvoiceCustomSections)

const mockInvoiceCustomSections = [
  { id: 'section-1', name: 'Section 1', code: 'SECTION_1' },
  { id: 'section-2', name: 'Section 2', code: 'SECTION_2' },
  { id: 'section-3', name: 'Section 3', code: 'SECTION_3' },
]

function prepare({
  open = true,
  selectedSections = [],
  skipInvoiceCustomSections = false,
  onSave = jest.fn(),
  onClose = jest.fn(),
  viewType = 'subscription',
  loading = false,
}: {
  open?: boolean
  selectedSections?: InvoiceCustomSectionBasic[]
  skipInvoiceCustomSections?: boolean
  onSave?: (selection: {
    behavior: InvoiceCustomSectionBehavior
    selectedSections: InvoiceCustomSectionBasic[]
  }) => void
  onClose?: () => void
  viewType?: string
  loading?: boolean
} = {}) {
  mockUseInvoiceCustomSections.mockReturnValue({
    data: mockInvoiceCustomSections,
    loading,
    error: false,
  } as ReturnType<typeof useInvoiceCustomSections>)

  return render(
    <EditInvoiceCustomSectionDialog
      open={open}
      onClose={onClose}
      selectedSections={selectedSections}
      skipInvoiceCustomSections={skipInvoiceCustomSections}
      onSave={onSave}
      viewType={viewType}
    />,
  )
}

describe('EditInvoiceCustomSectionDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('initializes with APPLY behavior when selectedSections are provided and shows combobox with selected sections', async () => {
    const selectedSections: InvoiceCustomSectionBasic[] = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    await act(() => prepare({ selectedSections, skipInvoiceCustomSections: false }))

    // Wait for the useEffect to initialize the state and show the combobox
    // The combobox only appears when APPLY behavior is selected, which confirms the initialization worked
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Verify save button is enabled (because sections are already selected)
    const saveButton = screen.getByTestId(EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID)

    expect(saveButton).not.toBeDisabled()
  })

  it('disables save button when APPLY behavior is selected but no sections are selected', async () => {
    const user = userEvent.setup()

    await act(() => prepare())

    // Switch to APPLY behavior
    const applyRadio = screen.getByTestId(EDIT_ICS_DIALOG_APPLY_RADIO_TEST_ID)
    const applyInput = applyRadio.querySelector('input[type="radio"]') as HTMLInputElement

    await user.click(applyInput)

    await waitFor(() => {
      const saveButton = screen.getByTestId(EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID)

      expect(saveButton).toBeDisabled()
    })
  })

  it('calls onSave with correct data when APPLY behavior is selected with sections', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    const onClose = jest.fn()
    const selectedSections: InvoiceCustomSectionBasic[] = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    await act(() => prepare({ selectedSections, onSave, onClose }))

    const saveButton = screen.getByTestId(EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID)

    await user.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
      expect(onSave).toHaveBeenCalledWith({
        behavior: InvoiceCustomSectionBehavior.APPLY,
        selectedSections: selectedSections,
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('correctly handles behavior changes and saves with empty selectedSections when switching from APPLY to FALLBACK', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    const onClose = jest.fn()

    await act(() => prepare({ onSave, onClose }))

    // Switch to APPLY behavior
    const applyRadio = screen.getByTestId(EDIT_ICS_DIALOG_APPLY_RADIO_TEST_ID)
    const applyInput = applyRadio.querySelector('input[type="radio"]') as HTMLInputElement

    await user.click(applyInput)

    // Verify combobox appears
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Switch back to FALLBACK
    const fallbackRadio = screen.getByTestId(EDIT_ICS_DIALOG_FALLBACK_RADIO_TEST_ID)
    const fallbackInput = fallbackRadio.querySelector('input[type="radio"]') as HTMLInputElement

    await user.click(fallbackInput)

    // Verify combobox is hidden
    await waitFor(() => {
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    // Save and verify correct data is passed (empty selectedSections for FALLBACK)
    const saveButton = screen.getByTestId(EDIT_ICS_DIALOG_SAVE_BUTTON_TEST_ID)

    await user.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
      expect(onSave).toHaveBeenCalledWith({
        behavior: InvoiceCustomSectionBehavior.FALLBACK,
        selectedSections: [],
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
