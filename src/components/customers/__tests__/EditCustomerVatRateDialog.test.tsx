import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME, FORM_DIALOG_TEST_ID } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME,
} from '~/core/constants/form'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { GetTaxRatesForEditCustomerDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { useEditCustomerVatRateDialog } from '../EditCustomerVatRateDialog'

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

const customer = {
  id: '1234',
  name: 'Customer Name',
  displayName: 'Customer name',
  externalId: '4567',
}

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const TestComponent = () => {
  const { openEditCustomerVatRateDialog } = useEditCustomerVatRateDialog()

  return (
    <button data-test="open-dialog" onClick={() => openEditCustomerVatRateDialog({ customer })}>
      Open Dialog
    </button>
  )
}

async function prepare({
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
}: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent />
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
  })

  it('renders', async () => {
    await prepare()

    expect(screen.queryByTestId(FORM_DIALOG_TEST_ID)).toBeInTheDocument()
  })

  it('should propose to create a new tax if none exists and have permissions', async () => {
    await prepare()

    await userEvent.click(
      screen
        .queryByTestId(FORM_DIALOG_TEST_ID)
        ?.querySelector(
          `.${SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
        ) as HTMLElement,
    )

    const createTaxItem = await screen.findByTestId('combobox-item-Create a tax_rate')

    expect(createTaxItem).toBeInTheDocument()
    expect(createTaxItem.querySelector(`a`)).toHaveAttribute('href', CREATE_TAX_ROUTE)
  })
})
