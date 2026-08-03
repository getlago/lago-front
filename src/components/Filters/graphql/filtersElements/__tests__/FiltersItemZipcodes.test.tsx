import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemZipcodes } from '~/components/Filters/graphql/filtersElements/FiltersItemZipcodes'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemZipcodes value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemZipcodes', () => {
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

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a comma-separated value', () => {
    it('THEN displays a chip for each zipcode', async () => {
      renderComponent('10001,20002')

      await waitFor(() => {
        expect(screen.getByText('10001')).toBeInTheDocument()
        expect(screen.getByText('20002')).toBeInTheDocument()
      })
    })
  })
})
