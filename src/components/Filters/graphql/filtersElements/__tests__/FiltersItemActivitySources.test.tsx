import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemActivitySources } from '~/components/Filters/graphql/filtersElements/FiltersItemActivitySources'
import { ActivitySourceEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemActivitySources value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemActivitySources', () => {
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
      ['api', ActivitySourceEnum.Api],
      ['front', ActivitySourceEnum.Front],
      ['system', ActivitySourceEnum.System],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${ActivitySourceEnum.Api},${ActivitySourceEnum.System}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(ActivitySourceEnum.Api)).toBeInTheDocument()
        expect(screen.getByText(ActivitySourceEnum.System)).toBeInTheDocument()
      })
    })
  })
})
