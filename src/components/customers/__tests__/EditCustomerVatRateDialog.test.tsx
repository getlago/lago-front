import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME, FORM_DIALOG_TEST_ID } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { COMBOBOX_ADD_VALUE_ITEM_TEST_ID } from '~/components/form/ComboBox/ComboBoxItemWrapper'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { GetTaxRatesForEditCustomerDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import {
  EDIT_CUSTOMER_VAT_RATE_SUBMIT_BUTTON_TEST_ID,
  OpenEditCustomerVatRateDialogParams,
  useEditCustomerVatRateDialog,
} from '../EditCustomerVatRateDialog'

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

const membershipWithPermissions = {
  id: '2',
  organization: {
    id: '3',
    name: 'Organization',
    logoUrl: 'https://logo.com',
  },
  permissions: {
    organizationTaxesUpdate: true,
  },
}

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    currentMembership: membershipWithPermissions,
  }),
}))

const mockNavigate = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

const customer = {
  id: '1234',
  name: 'Customer Name',
  displayName: 'Customer name',
  externalId: '4567',
}

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

type TestComponentProps = Pick<OpenEditCustomerVatRateDialogParams, 'appliedTaxRatesTaxesIds'>

const TestComponent = ({ appliedTaxRatesTaxesIds }: TestComponentProps) => {
  const { openEditCustomerVatRateDialog } = useEditCustomerVatRateDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() => openEditCustomerVatRateDialog({ customer, appliedTaxRatesTaxesIds })}
    >
      Open Dialog
    </button>
  )
}

const appliedTax = { id: 'tax-de', name: 'VAT DE', rate: 19, code: 'vat_de' }

const getTaxRatesMock = (
  searchTerm: string | undefined,
  collection: (typeof appliedTax)[],
): TestMocksType[number] => ({
  request: {
    query: GetTaxRatesForEditCustomerDocument,
    variables: { limit: 500, ...(searchTerm && { searchTerm }) },
  },
  result: {
    data: {
      taxes: {
        metadata: { currentPage: 1, totalPages: 1 },
        collection,
      },
    },
  },
})

const getComboBoxInput = (): HTMLElement =>
  screen.getByTestId(FORM_DIALOG_TEST_ID).querySelector('[role="combobox"]') as HTMLElement

async function prepare({
  appliedTaxRatesTaxesIds,
  mocks = [
    {
      request: {
        query: GetTaxRatesForEditCustomerDocument,
        variables: { limit: 500 },
      },
      result: {
        data: {
          taxes: {
            metadata: {
              currentPage: 1,
              totalPages: 1,
            },
            collection: [],
          },
        },
      },
    },
  ],
}: { mocks?: TestMocksType } & TestComponentProps = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent appliedTaxRatesTaxesIds={appliedTaxRatesTaxesIds} />
      </NiceModalWrapper>,
      { mocks },
    ),
  )

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })
}

describe('EditCustomerVatRateDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    NiceModal.remove(FORM_DIALOG_NAME)
    membershipWithPermissions.permissions.organizationTaxesUpdate = true
  })

  it('renders', async () => {
    await prepare()

    expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })

  it('should propose to create a new tax if none exists and have permissions', async () => {
    const user = userEvent.setup()

    await prepare()

    const input = screen
      .getByTestId(FORM_DIALOG_TEST_ID)
      .querySelector('[role="combobox"]') as HTMLElement

    // The tax rate ComboBox is freeSolo (allowAddValue): typing opens the popper and,
    // when no tax matches, surfaces the "create a tax" option.
    await user.click(input)
    await user.keyboard('a')

    const createTaxItem = await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)

    expect(createTaxItem).toBeInTheDocument()

    await user.click(within(createTaxItem).getByRole('option'))

    expect(mockNavigate).toHaveBeenCalledWith(CREATE_TAX_ROUTE)
  })

  it('WHEN an applied tax code is typed then submitted with Enter THEN the add button stays disabled', async () => {
    const user = userEvent.setup()

    await prepare({
      appliedTaxRatesTaxesIds: [appliedTax.id],
      mocks: [
        getTaxRatesMock(undefined, [appliedTax]),
        getTaxRatesMock(appliedTax.code, [appliedTax]),
      ],
    })

    const input = getComboBoxInput()

    await user.click(input)
    await user.type(input, appliedTax.code)

    expect(await screen.findByText(appliedTax.name)).toBeInTheDocument()

    await user.keyboard('{Enter}{Enter}')

    expect(screen.getByTestId(EDIT_CUSTOMER_VAT_RATE_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
  })

  it('WHEN the user cannot create taxes AND free text is submitted with Enter THEN the add button stays disabled', async () => {
    const user = userEvent.setup()

    membershipWithPermissions.permissions.organizationTaxesUpdate = false

    await prepare({
      mocks: [getTaxRatesMock(undefined, [appliedTax]), getTaxRatesMock('foo', [])],
    })

    const input = getComboBoxInput()

    await user.click(input)
    await user.type(input, 'foo')
    await user.keyboard('{Enter}')

    expect(screen.queryByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).not.toBeInTheDocument()
    expect(screen.getByTestId(EDIT_CUSTOMER_VAT_RATE_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
  })
})
