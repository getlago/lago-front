import { render, screen, waitFor } from '@testing-library/react'

import { ProductTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { FiltersItemProductType } from '../FiltersItemProductType'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) =>
  render(<FiltersItemProductType value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })

describe('FiltersItemProductType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays the combobox', async () => {
        renderComponent()

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a selected value', () => {
    it.each([
      ['fixed', ProductTypeEnum.Fixed, 'Fixed'],
      ['usage', ProductTypeEnum.Usage, 'Usage'],
    ])('THEN displays the %s type label in the input', async (_, value, label) => {
      renderComponent(value)

      await waitFor(() => {
        expect(screen.getByDisplayValue(label)).toBeInTheDocument()
      })
    })
  })
})
