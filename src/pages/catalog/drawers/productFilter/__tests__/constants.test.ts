import { PRODUCT_ITEM_FILTER_FORM_DEFAULTS, productFilterDrawerSchema } from '../constants'

const VALUE_REQUIRED_KEY = 'text_624ea7c29103fd010732ab7d'

describe('productFilterDrawerSchema', () => {
  // The combobox clear button stores `undefined`, not ''.
  it('reports the required message when productId is cleared', () => {
    const result = productFilterDrawerSchema.safeParse({
      ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
      name: 'N',
      code: 'c',
      productId: undefined,
      values: [{ billableMetricFilterId: 'bmf_1', value: 'eu' }],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(VALUE_REQUIRED_KEY)
  })
})
