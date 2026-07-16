import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import ProductItemFiltersList, {
  PRODUCT_ITEM_FILTERS_LIST_TEST_ID,
} from '../ProductItemFiltersList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('ProductItemFiltersList placeholder page', () => {
  describe('GIVEN the product item filters placeholder route', () => {
    describe('WHEN the page renders', () => {
      it('THEN displays the placeholder container', () => {
        render(<ProductItemFiltersList />)

        expect(screen.getByTestId(PRODUCT_ITEM_FILTERS_LIST_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
