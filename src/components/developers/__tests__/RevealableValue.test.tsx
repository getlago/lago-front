import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { render } from '~/test-utils'

import { REVEALABLE_VALUE_LOADING_TEST_ID, RevealableValue } from '../RevealableValue'

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

const VALUE_TEST_ID = 'value'
const REVEAL_BUTTON_TEST_ID = 'reveal-button'
const SECRET = 'whsec_currentkeyabc'

type Props = Partial<React.ComponentProps<typeof RevealableValue>>

const renderValue = (props: Props = {}) => {
  const onToggleReveal = jest.fn()

  render(
    <RevealableValue
      value={SECRET}
      isRevealed={false}
      onToggleReveal={onToggleReveal}
      valueTestId={VALUE_TEST_ID}
      revealButtonTestId={REVEAL_BUTTON_TEST_ID}
      {...props}
    />,
  )

  return { onToggleReveal }
}

describe('RevealableValue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the value is hidden', () => {
    it('THEN masks the value', () => {
      renderValue()

      expect(screen.getByTestId(VALUE_TEST_ID)).toHaveTextContent('••••••••abc')
      expect(screen.getByTestId(VALUE_TEST_ID)).not.toHaveTextContent(SECRET)
    })

    it('THEN shows the value unchanged when masking is off', () => {
      renderValue({ value: '••••••••abc', maskWhenHidden: false })

      expect(screen.getByTestId(VALUE_TEST_ID)).toHaveTextContent('••••••••abc')
    })

    describe('WHEN the reveal button is clicked', () => {
      it('THEN calls the toggle handler', async () => {
        const user = userEvent.setup()
        const { onToggleReveal } = renderValue()

        await user.click(screen.getByTestId(REVEAL_BUTTON_TEST_ID))

        expect(onToggleReveal).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the value is copied', () => {
      it('THEN copies the full value', async () => {
        const user = userEvent.setup()

        renderValue()

        await user.click(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        expect(copyToClipboard).toHaveBeenCalledWith(SECRET)
      })

      it('THEN calls the copy handler instead when one is given', async () => {
        const user = userEvent.setup()
        const onCopy = jest.fn()

        renderValue({ onCopy })

        await user.click(screen.getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        expect(onCopy).toHaveBeenCalledTimes(1)
        expect(copyToClipboard).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the value is revealed', () => {
    it('THEN shows the full value', () => {
      renderValue({ isRevealed: true })

      expect(screen.getByTestId(VALUE_TEST_ID)).toHaveTextContent(SECRET)
    })
  })

  describe('GIVEN the value is loading', () => {
    it('THEN shows a skeleton instead of the value', () => {
      renderValue({ isLoading: true })

      expect(screen.getByTestId(REVEALABLE_VALUE_LOADING_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(VALUE_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
