import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemPaymentStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemPaymentStatus'
import { InvoicePaymentStatusTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemPaymentStatus value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemPaymentStatus', () => {
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
      ['failed', InvoicePaymentStatusTypeEnum.Failed],
      ['pending', InvoicePaymentStatusTypeEnum.Pending],
      ['succeeded', InvoicePaymentStatusTypeEnum.Succeeded],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${InvoicePaymentStatusTypeEnum.Failed},${InvoicePaymentStatusTypeEnum.Succeeded}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(InvoicePaymentStatusTypeEnum.Failed)).toBeInTheDocument()
        expect(screen.getByText(InvoicePaymentStatusTypeEnum.Succeeded)).toBeInTheDocument()
      })
    })
  })
})
