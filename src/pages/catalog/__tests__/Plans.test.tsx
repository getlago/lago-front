import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import Plans, { PLANS_LIST_TEST_ID } from '../Plans'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('Plans placeholder page', () => {
  describe('GIVEN the plans placeholder route', () => {
    describe('WHEN the page renders', () => {
      it('THEN displays the placeholder container', () => {
        render(<Plans />)

        expect(screen.getByTestId(PLANS_LIST_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
