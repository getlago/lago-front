import { render, screen } from '@testing-library/react'

import { buildProductsComboboxData, ProductForComboboxData } from '../buildProductsComboboxData'

const translate = (key: string, data?: Record<string, unknown>): string =>
  data ? `${key}:${JSON.stringify(data)}` : key

const STANDALONE: ProductForComboboxData = {
  id: 'p-standalone',
  name: 'Standalone API',
  code: 'standalone_api',
  invoiceDisplayName: null,
  productCategory: null,
}

const CATEGORIZED: ProductForComboboxData = {
  id: 'p-categorized',
  name: 'Storage',
  code: 'storage',
  invoiceDisplayName: 'Storage (invoice)',
  productCategory: { code: 'infra', name: 'Infra', invoiceDisplayName: null },
}

describe('buildProductsComboboxData', () => {
  describe('GIVEN products with and without a category', () => {
    describe('WHEN no options are passed', () => {
      it('THEN should group by category code and fall back to the standalone group', () => {
        const { data } = buildProductsComboboxData([STANDALONE, CATEGORIZED], translate)

        expect(data.map(({ value, group }) => ({ value, group }))).toEqual([
          { value: 'p-standalone', group: 'standalone-products' },
          { value: 'p-categorized', group: 'infra' },
        ])
      })

      it('THEN should not set a disabled flag on any option', () => {
        const { data } = buildProductsComboboxData([STANDALONE, CATEGORIZED], translate)

        data.forEach((option) => expect(option).not.toHaveProperty('disabled'))
      })

      it('THEN should keep its own standalone header copy, not an override', () => {
        const { renderGroupHeader } = buildProductsComboboxData([STANDALONE], translate)

        const { container } = render(<>{renderGroupHeader['standalone-products']}</>)

        expect(container.textContent).not.toBe('')
        expect(container).not.toHaveTextContent('custom-title')
      })
    })

    describe('WHEN a standalone header override is passed', () => {
      it('THEN should render the given keys', () => {
        const { renderGroupHeader } = buildProductsComboboxData([STANDALONE], translate, {
          standaloneHeader: { titleKey: 'custom-title', captionKey: 'custom-caption' },
        })

        render(<>{renderGroupHeader['standalone-products']}</>)

        expect(screen.getByText('custom-title')).toBeInTheDocument()
        expect(screen.getByText('• custom-caption')).toBeInTheDocument()
      })
    })

    describe('WHEN isProductDisabled is passed', () => {
      it('THEN should flag each option from the callback', () => {
        const { data } = buildProductsComboboxData([STANDALONE, CATEGORIZED], translate, {
          isProductDisabled: (productId) => productId === 'p-categorized',
        })

        expect(data.map(({ value, disabled }) => ({ value, disabled }))).toEqual([
          { value: 'p-standalone', disabled: false },
          { value: 'p-categorized', disabled: true },
        ])
      })
    })

    describe('WHEN the options are keyed by code', () => {
      it('THEN should use the code as value and pass it to isProductDisabled', () => {
        const isProductDisabled = jest.fn((code: string) => code === 'storage')
        const { data } = buildProductsComboboxData([STANDALONE, CATEGORIZED], translate, {
          valueKey: 'code',
          isProductDisabled,
        })

        expect(data.map(({ value, disabled }) => ({ value, disabled }))).toEqual([
          { value: 'standalone_api', disabled: false },
          { value: 'storage', disabled: true },
        ])
        expect(isProductDisabled).toHaveBeenCalledWith('standalone_api')
      })
    })

    describe('WHEN a product has an invoice display name', () => {
      it('THEN should use it in the label', () => {
        const { data } = buildProductsComboboxData([CATEGORIZED], translate)

        expect(data[0].label).toContain('Storage (invoice)')
        expect(data[0].description).toBe('storage')
      })
    })
  })
})
