import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemInvoiceType } from '~/components/Filters/graphql/filtersElements/FiltersItemInvoiceType'
import { InvoiceTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemInvoiceType value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemInvoiceType', () => {
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
      ['add_on', InvoiceTypeEnum.AddOn],
      ['advance_charges', InvoiceTypeEnum.AdvanceCharges],
      ['credit', InvoiceTypeEnum.Credit],
      ['one_off', InvoiceTypeEnum.OneOff],
      ['progressive_billing', InvoiceTypeEnum.ProgressiveBilling],
      ['subscription', InvoiceTypeEnum.Subscription],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${InvoiceTypeEnum.Credit},${InvoiceTypeEnum.Subscription}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(InvoiceTypeEnum.Credit)).toBeInTheDocument()
        expect(screen.getByText(InvoiceTypeEnum.Subscription)).toBeInTheDocument()
      })
    })
  })
})
