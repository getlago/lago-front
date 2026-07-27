import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import CreateInvoiceCustomSection, {
  CREATE_CUSTOM_SECTION_CANCEL_BUTTON_TEST_ID,
  CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID,
  CREATE_CUSTOM_SECTION_DESCRIPTION_DELETE_TEST_ID,
  CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID,
  CREATE_CUSTOM_SECTION_DETAILS_INPUT_TEST_ID,
  CREATE_CUSTOM_SECTION_DISPLAY_NAME_INPUT_TEST_ID,
  CREATE_CUSTOM_SECTION_FORM_ID,
  CREATE_CUSTOM_SECTION_PREVIEW_BUTTON_TEST_ID,
  CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID,
  CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID,
} from '../CreateCustomSection'

const NAME_PLACEHOLDER = 'text_6584550dc4cec7adf861504f'
const CODE_PLACEHOLDER = 'text_6584550dc4cec7adf8615053'

const mockOnSave = jest.fn()
const mockCentralizedDialogOpen = jest.fn().mockResolvedValue({ reason: 'close' })
const mockOpenDrawer = jest.fn()
const mockScrollToTop = jest.fn()

let mockLoading = false
let mockIsEdition = false
let mockInvoiceCustomSection: Record<string, unknown> | undefined = undefined
let mockErrorCode: string | undefined = undefined

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({
    open: mockCentralizedDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/core/utils/domUtils', () => ({
  scrollToTop: () => mockScrollToTop(),
}))

jest.mock('~/hooks/useCreateEditInvoiceCustomSection', () => ({
  useCreateEditInvoiceCustomSection: () => ({
    loading: mockLoading,
    isEdition: mockIsEdition,
    invoiceCustomSection: mockInvoiceCustomSection,
    errorCode: mockErrorCode,
    onSave: mockOnSave,
    onClose: jest.fn(),
  }),
}))

jest.mock('~/components/settings/invoices/PreviewCustomSectionDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  return {
    __esModule: true,
    PreviewCustomSectionDrawer: forwardRef((_props: unknown, ref: unknown) => {
      useImperativeHandle(ref, () => ({
        openDrawer: mockOpenDrawer,
        closeDrawer: jest.fn(),
      }))

      return <div data-test="preview-custom-section-drawer" />
    }),
  }
})

describe('CreateCustomSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoading = false
    mockIsEdition = false
    mockInvoiceCustomSection = undefined
    mockErrorCode = undefined
  })

  describe('GIVEN the section is loading', () => {
    describe('WHEN rendering the page', () => {
      it('THEN should not display the form fields', async () => {
        mockLoading = true

        await act(() => render(<CreateInvoiceCustomSection />))

        expect(screen.queryByPlaceholderText(NAME_PLACEHOLDER)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the section has finished loading', () => {
    describe('WHEN rendering the page in creation mode', () => {
      it.each([
        ['close button', CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID],
        ['cancel button', CREATE_CUSTOM_SECTION_CANCEL_BUTTON_TEST_ID],
        ['submit button', CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID],
        ['show description button', CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID],
        ['display name input', CREATE_CUSTOM_SECTION_DISPLAY_NAME_INPUT_TEST_ID],
        ['details input', CREATE_CUSTOM_SECTION_DETAILS_INPUT_TEST_ID],
        ['preview button', CREATE_CUSTOM_SECTION_PREVIEW_BUTTON_TEST_ID],
      ])('THEN should display the %s', async (_, testId) => {
        await act(() => render(<CreateInvoiceCustomSection />))

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should render the form element with the correct id', async () => {
        const { container } = await act(() => render(<CreateInvoiceCustomSection />))

        expect(container.querySelector(`form#${CREATE_CUSTOM_SECTION_FORM_ID}`)).toBeInTheDocument()
      })

      it('THEN should not display the description input by default', async () => {
        await act(() => render(<CreateInvoiceCustomSection />))

        expect(
          screen.queryByTestId(CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should render the name and code inputs empty', async () => {
        await act(() => render(<CreateInvoiceCustomSection />))

        expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toHaveValue('')
        expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toHaveValue('')
      })
    })

    describe('WHEN clicking the show description button', () => {
      it('THEN should display the description input', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID))

        expect(
          screen.getByTestId(CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the delete description button', () => {
      it('THEN should hide the description input and clear its value', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID))

        const descriptionContainer = screen.getByTestId(
          CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID,
        )
        const descriptionInput = descriptionContainer.querySelector(
          'textarea',
        ) as HTMLTextAreaElement

        await user.type(descriptionInput, 'Some description')

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_DESCRIPTION_DELETE_TEST_ID))

        expect(
          screen.queryByTestId(CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN typing in the name field', () => {
      it('THEN should auto-generate the code field', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER)

        await user.type(nameInput, 'My Section')

        await waitFor(() => {
          expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toHaveValue('my_section')
        })
      })
    })

    describe('WHEN clicking the preview button', () => {
      it('THEN should open the preview drawer with the current displayName and details values', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        const displayNameContainer = screen.getByTestId(
          CREATE_CUSTOM_SECTION_DISPLAY_NAME_INPUT_TEST_ID,
        )
        const displayNameInput = displayNameContainer.querySelector('input') as HTMLInputElement

        await user.type(displayNameInput, 'My display name')

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_PREVIEW_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOpenDrawer).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'My display name' }),
          )
        })
      })
    })

    describe('WHEN the form is not dirty', () => {
      describe('AND clicking the close button', () => {
        it('THEN should navigate away without opening a warning dialog', async () => {
          const user = userEvent.setup()

          await act(() => render(<CreateInvoiceCustomSection />))

          await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID))

          expect(mockCentralizedDialogOpen).not.toHaveBeenCalled()
          await waitFor(() => {
            expect(testMockNavigateFn).toHaveBeenCalled()
          })
        })
      })
    })

    describe('WHEN the form is dirty', () => {
      describe('AND clicking the close button', () => {
        it('THEN should open the dirty attributes warning dialog', async () => {
          const user = userEvent.setup()

          await act(() => render(<CreateInvoiceCustomSection />))

          await user.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'My Section')

          await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID))

          await waitFor(() => {
            expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
              expect.objectContaining({
                title: expect.any(String),
                description: expect.any(String),
                actionText: expect.any(String),
                colorVariant: 'danger',
                onAction: expect.any(Function),
              }),
            )
          })
        })
      })

      describe('AND clicking the cancel button', () => {
        it('THEN should open the dirty attributes warning dialog', async () => {
          const user = userEvent.setup()

          await act(() => render(<CreateInvoiceCustomSection />))

          await user.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'My Section')

          await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_CANCEL_BUTTON_TEST_ID))

          await waitFor(() => {
            expect(mockCentralizedDialogOpen).toHaveBeenCalled()
          })
        })
      })
    })

    describe('WHEN submitting an empty form', () => {
      it('THEN should not call onSave', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).not.toHaveBeenCalled()
        })
      })
    })

    describe('WHEN filling name and code but leaving both displayName and details empty', () => {
      it('THEN should not call onSave', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        await user.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'My Section')

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).not.toHaveBeenCalled()
        })
      })
    })

    describe('WHEN filling name, code and details only', () => {
      it('THEN should call onSave with the expected values', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        await user.type(screen.getByPlaceholderText(NAME_PLACEHOLDER), 'My Section')

        const detailsContainer = screen.getByTestId(CREATE_CUSTOM_SECTION_DETAILS_INPUT_TEST_ID)
        const detailsInput = detailsContainer.querySelector('textarea') as HTMLTextAreaElement

        await user.type(detailsInput, 'Some details')

        await user.click(screen.getByTestId(CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'My Section',
              code: 'my_section',
              details: 'Some details',
            }),
          )
        })
      })
    })
  })

  describe('GIVEN an existing invoice custom section', () => {
    beforeEach(() => {
      mockIsEdition = true
      mockInvoiceCustomSection = {
        name: 'Existing section',
        code: 'existing_section',
        description: 'Existing description',
        displayName: 'Existing display name',
        details: 'Existing details',
      }
    })

    describe('WHEN rendering the page', () => {
      it('THEN should pre-fill the name and code fields', async () => {
        await act(() => render(<CreateInvoiceCustomSection />))

        expect(screen.getByPlaceholderText(NAME_PLACEHOLDER)).toHaveValue('Existing section')
        expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toHaveValue('existing_section')
      })

      it('THEN should display the description input since a description already exists', async () => {
        await act(() => render(<CreateInvoiceCustomSection />))

        expect(
          screen.getByTestId(CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN editing the name field', () => {
      it('THEN should not override the existing code', async () => {
        const user = userEvent.setup()

        await act(() => render(<CreateInvoiceCustomSection />))

        const nameInput = screen.getByPlaceholderText(NAME_PLACEHOLDER)

        await user.clear(nameInput)
        await user.type(nameInput, 'Updated name')

        expect(screen.getByPlaceholderText(CODE_PLACEHOLDER)).toHaveValue('existing_section')
      })
    })
  })

  describe('GIVEN the server returned an existing code error', () => {
    beforeEach(() => {
      mockErrorCode = 'existingCode'
    })

    describe('WHEN rendering the page', () => {
      it('THEN should scroll to the top', async () => {
        await act(() => render(<CreateInvoiceCustomSection />))

        await waitFor(() => {
          expect(mockScrollToTop).toHaveBeenCalled()
        })
      })
    })
  })
})
