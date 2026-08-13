import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemHttpMethods } from '~/components/Filters/graphql/filtersElements/FiltersItemHttpMethods'
import { HttpMethodEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemHttpMethods value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemHttpMethods', () => {
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
      ['delete', HttpMethodEnum.Delete],
      ['post', HttpMethodEnum.Post],
      ['put', HttpMethodEnum.Put],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${HttpMethodEnum.Post},${HttpMethodEnum.Put}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(HttpMethodEnum.Post)).toBeInTheDocument()
        expect(screen.getByText(HttpMethodEnum.Put)).toBeInTheDocument()
      })
    })
  })
})
