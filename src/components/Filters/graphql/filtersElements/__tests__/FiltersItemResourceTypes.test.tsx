import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemResourceTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemResourceTypes'
import { ResourceTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemResourceTypes value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemResourceTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a single value', () => {
    it.each([
      ['billable_metric', ResourceTypeEnum.BillableMetric],
      ['invoice', ResourceTypeEnum.Invoice],
      ['subscription', ResourceTypeEnum.Subscription],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${ResourceTypeEnum.Invoice},${ResourceTypeEnum.Subscription}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(ResourceTypeEnum.Invoice)).toBeInTheDocument()
        expect(screen.getByText(ResourceTypeEnum.Subscription)).toBeInTheDocument()
      })
    })
  })
})
