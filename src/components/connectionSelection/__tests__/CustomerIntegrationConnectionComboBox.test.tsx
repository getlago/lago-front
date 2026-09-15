import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { CONNECTION_COMBOBOX_DEFAULT_BADGE_TEST_ID } from '~/components/customerConnections/ConnectionComboBox'
import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { IntegrationTypeEnum } from '~/generated/graphql'
import { CustomerIntegrationConnection } from '~/hooks/customer/useCustomerIntegrationConnections'
import { render } from '~/test-utils'

import { CustomerIntegrationConnectionComboBox } from '../CustomerIntegrationConnectionComboBox'

const NETSUITE_CONNECTION: CustomerIntegrationConnection = {
  id: 'ic-1',
  code: 'customer_netsuite',
  name: 'Netsuite EU',
  group: 'Netsuite',
  integrationType: IntegrationTypeEnum.Netsuite,
  isDefault: true,
}

const XERO_CONNECTION: CustomerIntegrationConnection = {
  id: 'ic-2',
  code: 'customer_xero',
  name: 'Xero UK',
  group: 'Xero',
  integrationType: IntegrationTypeEnum.Xero,
  isDefault: false,
}

const mockConnections = { current: [NETSUITE_CONNECTION, XERO_CONNECTION] }
const mockLoading = { current: false }
const mockCategory: { current: IntegrationConnectionCategory | null } = { current: null }

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/form/ComboBox/ComboBoxVirtualizedList', () => ({
  GROUP_ITEM_KEY: 'combobox-group-by',
  ComboBoxVirtualizedList: ({ elements }: { elements: ReactNode[] }) => <>{elements}</>,
}))

jest.mock('~/hooks/customer/useCustomerIntegrationConnections', () => ({
  useCustomerIntegrationConnections: ({
    category,
  }: {
    category: IntegrationConnectionCategory
  }) => {
    mockCategory.current = category

    return {
      connections: mockConnections.current,
      options: mockConnections.current.map((connection) => ({
        value: connection.code,
        label: connection.name,
        subLabel: connection.code,
        group: connection.group,
        isDefault: connection.isDefault,
      })),
      defaultConnection: mockConnections.current.find((connection) => connection.isDefault),
      loading: mockLoading.current,
    }
  },
}))

const renderComboBox = (
  props: Partial<React.ComponentProps<typeof CustomerIntegrationConnectionComboBox>> = {},
) => {
  const onChange = jest.fn()

  render(
    <CustomerIntegrationConnectionComboBox
      customerId="customer-1"
      category={ConnectionCategory.Accounting}
      value=""
      onChange={onChange}
      {...props}
    />,
  )

  const input = document.querySelector(
    `input[name="selectConnection-${props.category || ConnectionCategory.Accounting}"]`,
  ) as HTMLInputElement

  return { onChange, input }
}

const openOptions = async (user: ReturnType<typeof userEvent.setup>, input: HTMLInputElement) => {
  const chevron = input.parentElement?.querySelector('[data-test^="chevron-up-down"]') as SVGElement

  await user.click(chevron.closest('button') as HTMLButtonElement)
}

describe('CustomerIntegrationConnectionComboBox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnections.current = [NETSUITE_CONNECTION, XERO_CONNECTION]
    mockLoading.current = false
    mockCategory.current = null
  })

  describe('GIVEN the customer connections of a category', () => {
    describe('WHEN the combobox renders', () => {
      it.each<IntegrationConnectionCategory>([
        ConnectionCategory.Accounting,
        ConnectionCategory.Crm,
        ConnectionCategory.Tax,
      ])('THEN should scope the field to the %s category', (category) => {
        const { input } = renderComboBox({ category })

        expect(input).toBeInTheDocument()
        expect(mockCategory.current).toBe(category)
      })
    })

    describe('WHEN a stored code matches an option', () => {
      it('THEN should display its connection name', () => {
        const { input } = renderComboBox({ value: XERO_CONNECTION.code })

        expect(input).toHaveValue(XERO_CONNECTION.name)
      })
    })

    describe('WHEN the stored code is no longer among the options', () => {
      // A connection removed from the customer after the object was saved would otherwise
      // render as a raw orphan code the user cannot act on.
      it('THEN should show nothing rather than the stale code', () => {
        const { input } = renderComboBox({ value: 'deleted_connection' })

        expect(input).toHaveValue('')
      })
    })

    describe('WHEN the list is opened', () => {
      it('THEN should badge the customer default option', async () => {
        const user = userEvent.setup()
        const { input } = renderComboBox()

        await openOptions(user, input)

        await waitFor(() => {
          expect(screen.getAllByTestId(CONNECTION_COMBOBOX_DEFAULT_BADGE_TEST_ID)).toHaveLength(1)
        })
      })

      it('THEN should publish the picked connection code', async () => {
        const user = userEvent.setup()
        const { input, onChange } = renderComboBox()

        await openOptions(user, input)

        const option = await waitFor(
          () => screen.getAllByTestId(XERO_CONNECTION.code).at(-1) as HTMLElement,
        )

        await user.click(option)

        expect(onChange).toHaveBeenCalledWith(XERO_CONNECTION.code)
      })
    })
  })

  describe('GIVEN the customer has no connection in the category', () => {
    describe('WHEN the list is opened', () => {
      it('THEN should offer no option', async () => {
        mockConnections.current = []

        const user = userEvent.setup()
        const { input } = renderComboBox()

        await openOptions(user, input)

        expect(screen.queryByTestId(NETSUITE_CONNECTION.code)).not.toBeInTheDocument()
      })
    })
  })
})
