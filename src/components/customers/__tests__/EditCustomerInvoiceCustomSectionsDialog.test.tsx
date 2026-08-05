import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { useEditCustomerInvoiceCustomSectionsDialog } from '~/components/customers/EditCustomerInvoiceCustomSectionsDialog'
import { DIALOG_TITLE_TEST_ID, FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import {
  EditCustomerInvoiceCustomSectionDocument,
  GetCustomerInvoiceCustomSectionsDocument,
  GetInvoiceCustomSectionsDocument,
} from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const CUSTOMER_ID = 'customer-123'
const CUSTOMER_EXTERNAL_ID = 'ext-customer-123'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const mockInvoiceCustomSections = {
  invoiceCustomSections: {
    __typename: 'InvoiceCustomSectionCollection',
    collection: [
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-1',
        name: 'Section 1',
        code: 'SECTION_1',
      },
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-2',
        name: 'Section 2',
        code: 'SECTION_2',
      },
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-3',
        name: 'Section 3',
        code: 'SECTION_3',
      },
    ],
  },
}

const mockCustomerFallback = {
  customer: {
    __typename: 'Customer',
    id: CUSTOMER_ID,
    externalId: CUSTOMER_EXTERNAL_ID,
    configurableInvoiceCustomSections: [],
    hasOverwrittenInvoiceCustomSectionsSelection: false,
    skipInvoiceCustomSections: false,
  },
}

const mockCustomerCustomSections = {
  customer: {
    __typename: 'Customer',
    id: CUSTOMER_ID,
    externalId: CUSTOMER_EXTERNAL_ID,
    configurableInvoiceCustomSections: [
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-1',
        name: 'Section 1',
      },
      {
        __typename: 'InvoiceCustomSection',
        id: 'section-2',
        name: 'Section 2',
      },
    ],
    hasOverwrittenInvoiceCustomSectionsSelection: true,
    skipInvoiceCustomSections: false,
  },
}

const NiceModalWrapper = ({ children }: { children: ReactNode }) => (
  <NiceModal.Provider>{children}</NiceModal.Provider>
)

const TestComponent = () => {
  const { openEditCustomerInvoiceCustomSectionsDialog } =
    useEditCustomerInvoiceCustomSectionsDialog(CUSTOMER_ID)

  return (
    <button data-test="open-dialog" onClick={openEditCustomerInvoiceCustomSectionsDialog}>
      Open Dialog
    </button>
  )
}

async function prepare({
  customerMock = mockCustomerFallback,
  mocks = [],
}: {
  customerMock?: typeof mockCustomerFallback | typeof mockCustomerCustomSections
  mocks?: TestMocksType
} = {}) {
  const defaultMocks: TestMocksType = [
    {
      request: {
        query: GetCustomerInvoiceCustomSectionsDocument,
        variables: { customerId: CUSTOMER_ID },
      },
      result: {
        data: customerMock,
      },
    },
    {
      request: {
        query: GetInvoiceCustomSectionsDocument,
        variables: {},
      },
      result: {
        data: mockInvoiceCustomSections,
      },
    },
    ...mocks,
  ]

  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent />
      </NiceModalWrapper>,
      { mocks: defaultMocks } as { mocks: TestMocksType },
    ),
  )

  // Wait for the customer sections query to resolve so the seed uses fresh data.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('EditCustomerInvoiceCustomSectionsDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    NiceModal.remove(FORM_DIALOG_NAME)
  })

  describe('Form interaction and MultipleComboBox visibility', () => {
    it('should show MultipleComboBox when APPLY radiobox is selected and hide for others', async () => {
      const user = userEvent.setup()

      await prepare({ customerMock: mockCustomerFallback })

      const radioButtons = screen.getAllByRole('radio')

      // Initially FALLBACK is selected, no MultipleComboBox
      expect(screen.queryByPlaceholderText(/select/i)).not.toBeInTheDocument()

      // Select APPLY (second radio)
      await user.click(radioButtons[1])

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/select/i)).toBeInTheDocument()
      })

      // Select FALLBACK (first radio)
      await user.click(radioButtons[0])

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/select/i)).not.toBeInTheDocument()
      })

      // Select DEACTIVATE (third radio)
      await user.click(radioButtons[2])

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/select/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Submit with FALLBACK behavior', () => {
    it('should call mutation with correct FALLBACK parameters and show success toast', async () => {
      const user = userEvent.setup()

      const mutationMock = {
        request: {
          query: EditCustomerInvoiceCustomSectionDocument,
          variables: {
            input: {
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              skipInvoiceCustomSections: false,
              configurableInvoiceCustomSectionIds: [],
            },
          },
        },
        result: {
          data: {
            updateCustomer: {
              __typename: 'Customer',
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              configurableInvoiceCustomSections: [],
              hasOverwrittenInvoiceCustomSectionsSelection: false,
              skipInvoiceCustomSections: false,
            },
          },
        },
      }

      await prepare({ customerMock: mockCustomerCustomSections, mocks: [mutationMock] })

      const radioButtons = screen.getAllByRole('radio')

      // Change from APPLY (seeded) to FALLBACK
      await user.click(radioButtons[0])

      // The submit button is labelled "Edit behavior".
      const submitButton = screen.getByRole('button', { name: /edit behavior/i })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'success',
          message: expect.any(String),
        })
      })
    })
  })

  describe('Submit with DEACTIVATE behavior', () => {
    it('should call mutation with skipInvoiceCustomSections and null ids', async () => {
      const user = userEvent.setup()

      const mutationMock = {
        request: {
          query: EditCustomerInvoiceCustomSectionDocument,
          variables: {
            input: {
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              skipInvoiceCustomSections: true,
              configurableInvoiceCustomSectionIds: null,
            },
          },
        },
        result: {
          data: {
            updateCustomer: {
              __typename: 'Customer',
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              configurableInvoiceCustomSections: [],
              hasOverwrittenInvoiceCustomSectionsSelection: false,
              skipInvoiceCustomSections: true,
            },
          },
        },
      }

      await prepare({ customerMock: mockCustomerFallback, mocks: [mutationMock] })

      const radioButtons = screen.getAllByRole('radio')

      // Select DEACTIVATE
      await user.click(radioButtons[2])

      await user.click(screen.getByRole('button', { name: /edit behavior/i }))

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'success',
          message: expect.any(String),
        })
      })
    })
  })

  describe('Submit with APPLY behavior', () => {
    it('should keep submit disabled while CUSTOM_SECTIONS is selected without any section', async () => {
      const user = userEvent.setup()

      await prepare({ customerMock: mockCustomerFallback })

      const radioButtons = screen.getAllByRole('radio')

      // Select CUSTOM_SECTIONS
      await user.click(radioButtons[1])

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/select/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /edit behavior/i })

      // revalidateLogic() validates on submit, so the button is only disabled once an
      // attempt has been made and the empty selection has been rejected.
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      // The empty selection never reaches the mutation, so no success toast.
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should seed the already applied sections as selected options and submit them unchanged', async () => {
      const user = userEvent.setup()

      const mutationMock = {
        request: {
          query: EditCustomerInvoiceCustomSectionDocument,
          variables: {
            input: {
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              skipInvoiceCustomSections: false,
              configurableInvoiceCustomSectionIds: ['section-1', 'section-2'],
            },
          },
        },
        result: {
          data: {
            updateCustomer: {
              __typename: 'Customer',
              id: CUSTOMER_ID,
              externalId: CUSTOMER_EXTERNAL_ID,
              configurableInvoiceCustomSections:
                mockCustomerCustomSections.customer.configurableInvoiceCustomSections,
              hasOverwrittenInvoiceCustomSectionsSelection: true,
              skipInvoiceCustomSections: false,
            },
          },
        },
      }

      await prepare({ customerMock: mockCustomerCustomSections, mocks: [mutationMock] })

      // The seeded selection is rendered as tags, which only works if the seed uses the
      // option shape the MultipleComboBox expects.
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()

      const submitButton = screen.getByRole('button', { name: /edit behavior/i })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'success',
          message: expect.any(String),
        })
      })
    })
  })
})
