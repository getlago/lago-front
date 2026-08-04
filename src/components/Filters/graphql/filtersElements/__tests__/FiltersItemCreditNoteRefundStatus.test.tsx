import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCreditNoteRefundStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteRefundStatus'
import { CreditNoteRefundStatusEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemCreditNoteRefundStatus value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemCreditNoteRefundStatus', () => {
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
      ['succeeded', CreditNoteRefundStatusEnum.Succeeded],
      ['pending', CreditNoteRefundStatusEnum.Pending],
      ['failed', CreditNoteRefundStatusEnum.Failed],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${CreditNoteRefundStatusEnum.Succeeded},${CreditNoteRefundStatusEnum.Failed}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(CreditNoteRefundStatusEnum.Succeeded)).toBeInTheDocument()
        expect(screen.getByText(CreditNoteRefundStatusEnum.Failed)).toBeInTheDocument()
      })
    })
  })
})
