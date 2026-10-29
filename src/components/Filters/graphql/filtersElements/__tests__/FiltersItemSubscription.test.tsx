import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemSubscription } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscription'
import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

let mockHasSubscriptionsView = true

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: () => mockHasSubscriptionsView,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string, mocks: TestMocksType = []) =>
  render(<FiltersItemSubscription value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasSubscriptionsView = true
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a value stored before the filter was a combobox', () => {
    it('THEN shows the raw id as the selection', async () => {
      renderComponent('sub_ext_1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('sub_ext_1')
      })
    })
  })

  describe('GIVEN a value picked from the combobox', () => {
    it('THEN shows its label before any search runs', async () => {
      renderComponent(`sub_ext_1${filterDataInlineSeparator}sub_ext_1 - Acme`)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('sub_ext_1 - Acme')
      })
    })
  })

  describe('GIVEN a member without the subscriptions view permission', () => {
    it('THEN falls back to a text input holding the external id', async () => {
      mockHasSubscriptionsView = false

      renderComponent(`sub_ext_1${filterDataInlineSeparator}sub_ext_1 - Acme`)

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('sub_ext_1')
      })
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })
})
