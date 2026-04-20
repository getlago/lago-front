import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { render } from '~/test-utils'

import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID, TypographyWithCopy } from '../TypographyWithCopy'

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

describe('TypographyWithCopy', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN displaying text content', () => {
      it('THEN should display the text', () => {
        render(<TypographyWithCopy>some-id-123</TypographyWithCopy>)

        expect(screen.getByText('some-id-123')).toBeInTheDocument()
      })

      it('THEN should render the copy button with an end icon', () => {
        render(<TypographyWithCopy>some-id-123</TypographyWithCopy>)

        expect(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN typography props are passed', () => {
      it('THEN should render with the specified variant', () => {
        render(
          <TypographyWithCopy variant="captionCode" color="grey700">
            plan_code_123
          </TypographyWithCopy>,
        )

        expect(screen.getByTestId('captionCode')).toBeInTheDocument()
      })

      it('THEN should apply custom className to the button', () => {
        render(<TypographyWithCopy className="custom-class">text</TypographyWithCopy>)

        const button = screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID)

        expect(button).toHaveClass('custom-class')
      })
    })
  })

  describe('GIVEN the user clicks the copy button', () => {
    describe('WHEN the button is clicked', () => {
      it('THEN should copy the text to clipboard', async () => {
        const user = userEvent.setup()

        render(<TypographyWithCopy>abc-def-456</TypographyWithCopy>)

        await user.click(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        expect(copyToClipboard).toHaveBeenCalledWith('abc-def-456')
      })

      it('THEN should show an info toast', async () => {
        const user = userEvent.setup()

        render(<TypographyWithCopy>abc-def-456</TypographyWithCopy>)

        await user.click(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
      })

      it('THEN should stop event propagation', async () => {
        const parentClickHandler = jest.fn()
        const user = userEvent.setup()

        render(
          /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
          <div onClick={parentClickHandler}>
            <TypographyWithCopy>some-value</TypographyWithCopy>
          </div>,
        )

        await user.click(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        expect(parentClickHandler).not.toHaveBeenCalled()
      })
    })
  })
})
