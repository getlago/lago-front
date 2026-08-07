import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import RateCardsList, { RATE_CARDS_LIST_TEST_ID } from '../RateCardsList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('RateCardsList placeholder page', () => {
  describe('GIVEN the rate cards placeholder route', () => {
    describe('WHEN the page renders', () => {
      it('THEN displays the placeholder container', () => {
        render(<RateCardsList />)

        expect(screen.getByTestId(RATE_CARDS_LIST_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
