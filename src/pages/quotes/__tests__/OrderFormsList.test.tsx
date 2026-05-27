import { screen } from '@testing-library/react'

import {
  GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
  GENERIC_PLACEHOLDER_TITLE_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { render } from '~/test-utils'

import OrderFormsList from '../OrderFormsList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('OrderFormsList', () => {
  describe('GIVEN the component is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the empty state placeholder', () => {
        render(<OrderFormsList />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the correct title in the placeholder', () => {
        render(<OrderFormsList />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TITLE_TEST_ID)).toHaveTextContent(
          'text_17757461968258p4ij8g74zp',
        )
      })

      it('THEN should display the correct subtitle in the placeholder', () => {
        render(<OrderFormsList />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_SUBTITLE_TEST_ID)).toHaveTextContent(
          'text_1775746196826qogq3id888u',
        )
      })
    })
  })
})
