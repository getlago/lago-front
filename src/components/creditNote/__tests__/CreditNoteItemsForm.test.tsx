import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { createMockFormikProps } from './formikProps.factory'

import { CreditNoteItemsForm, PRODUCT_FEES_CHECKBOX_TEST_ID } from '../CreditNoteItemsForm'
import { CreditNoteForm, FromFee } from '../types'

const buildProductFee = (id: string, checked: boolean): FromFee => ({
  id,
  checked,
  maxAmount: 1200,
  name: `Product ${id}`,
  value: 12,
})

const renderComponent = (productFee: FromFee[]) => {
  const formikProps = createMockFormikProps<CreditNoteForm>({ values: { productFee } })

  render(
    <CreditNoteItemsForm
      isPrepaidCreditsInvoice={false}
      formikProps={formikProps}
      feeForProduct={productFee}
      currency={CurrencyEnum.Eur}
    />,
    { wrapper: AllTheProviders },
  )

  const groupCheckbox = screen
    .getByTestId(PRODUCT_FEES_CHECKBOX_TEST_ID)
    .querySelector('input[type="checkbox"]') as HTMLInputElement

  return { formikProps, groupCheckbox }
}

describe('CreditNoteItemsForm', () => {
  describe('GIVEN product fees', () => {
    it('THEN the group checkbox is checked when every product fee is checked', () => {
      const { groupCheckbox } = renderComponent([
        buildProductFee('1', true),
        buildProductFee('2', true),
      ])

      expect(groupCheckbox).toBeChecked()
    })

    it('THEN the group checkbox is indeterminate when only some product fees are checked', () => {
      const { groupCheckbox } = renderComponent([
        buildProductFee('1', true),
        buildProductFee('2', false),
      ])

      expect(groupCheckbox).toHaveAttribute('aria-checked', 'mixed')
    })

    it('WHEN the group checkbox is clicked THEN every product fee is unchecked', async () => {
      const user = userEvent.setup()
      const { formikProps } = renderComponent([
        buildProductFee('1', true),
        buildProductFee('2', true),
      ])

      await user.click(screen.getByTestId(PRODUCT_FEES_CHECKBOX_TEST_ID))

      expect(formikProps.setFieldValue).toHaveBeenCalledWith('productFee', [
        expect.objectContaining({ id: '1', checked: false }),
        expect.objectContaining({ id: '2', checked: false }),
      ])
    })
  })
})
