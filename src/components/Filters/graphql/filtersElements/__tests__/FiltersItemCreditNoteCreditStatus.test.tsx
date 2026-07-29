import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCreditNoteCreditStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteCreditStatus'
import { CreditNoteCreditStatusEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemCreditNoteCreditStatus value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemCreditNoteCreditStatus', () => {
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
      ['available', CreditNoteCreditStatusEnum.Available],
      ['consumed', CreditNoteCreditStatusEnum.Consumed],
      ['voided', CreditNoteCreditStatusEnum.Voided],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${CreditNoteCreditStatusEnum.Available},${CreditNoteCreditStatusEnum.Consumed}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(CreditNoteCreditStatusEnum.Available)).toBeInTheDocument()
        expect(screen.getByText(CreditNoteCreditStatusEnum.Consumed)).toBeInTheDocument()
      })
    })
  })
})
