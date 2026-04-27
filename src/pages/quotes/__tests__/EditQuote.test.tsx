import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import EditQuote, { EDIT_QUOTE_SAVE_BUTTON_TEST_ID } from '../EditQuote'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('EditQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-123' })
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the close button', () => {
        render(<EditQuote />)

        expect(screen.getByTestId(EDIT_QUOTE_SAVE_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the close button is clicked', () => {
      it('THEN should navigate to the quote details page', async () => {
        const user = userEvent.setup()

        render(<EditQuote />)

        await user.click(screen.getByTestId(EDIT_QUOTE_SAVE_BUTTON_TEST_ID))

        expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-123/overview')
      })
    })
  })

  describe('GIVEN no quoteId param', () => {
    describe('WHEN the close button is clicked', () => {
      it('THEN should not navigate', async () => {
        const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

        useParamsMock.mockReturnValue({})

        const user = userEvent.setup()

        render(<EditQuote />)

        await user.click(screen.getByTestId(EDIT_QUOTE_SAVE_BUTTON_TEST_ID))

        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })
})
