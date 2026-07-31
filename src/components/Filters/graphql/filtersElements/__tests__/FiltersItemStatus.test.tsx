import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemStatus'
import { InvoiceStatusTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemStatus value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemStatus', () => {
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
      ['draft', InvoiceStatusTypeEnum.Draft],
      ['failed', InvoiceStatusTypeEnum.Failed],
      ['finalized', InvoiceStatusTypeEnum.Finalized],
      ['pending', InvoiceStatusTypeEnum.Pending],
      ['voided', InvoiceStatusTypeEnum.Voided],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${InvoiceStatusTypeEnum.Draft},${InvoiceStatusTypeEnum.Finalized}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(InvoiceStatusTypeEnum.Draft)).toBeInTheDocument()
        expect(screen.getByText(InvoiceStatusTypeEnum.Finalized)).toBeInTheDocument()
      })
    })
  })
})
