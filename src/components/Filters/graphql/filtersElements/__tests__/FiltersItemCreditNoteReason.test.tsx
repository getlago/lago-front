import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCreditNoteReason } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteReason'
import { CreditNoteReasonEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCreditNoteReason value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCreditNoteReason', () => {
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
      ['duplicated_charge', CreditNoteReasonEnum.DuplicatedCharge],
      ['fraudulent_charge', CreditNoteReasonEnum.FraudulentCharge],
      ['order_cancellation', CreditNoteReasonEnum.OrderCancellation],
      ['order_change', CreditNoteReasonEnum.OrderChange],
      ['other', CreditNoteReasonEnum.Other],
      ['product_unsatisfactory', CreditNoteReasonEnum.ProductUnsatisfactory],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${CreditNoteReasonEnum.Other},${CreditNoteReasonEnum.OrderChange}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(CreditNoteReasonEnum.Other)).toBeInTheDocument()
        expect(screen.getByText(CreditNoteReasonEnum.OrderChange)).toBeInTheDocument()
      })
    })
  })
})
