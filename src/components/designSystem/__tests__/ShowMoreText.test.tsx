import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT,
  SHOW_MORE_TEXT_BUTTON_TEST_ID,
  ShowMoreText,
} from '../ShowMoreText'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const UNBREAKABLE_TEXT = 'a'.repeat(500)

describe('ShowMoreText', () => {
  describe('GIVEN a text shorter than the limit', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays the whole text without a "See more" button', () => {
        render(<ShowMoreText text="A short description" limit={20} />)

        expect(screen.getByText('A short description')).toBeInTheDocument()
        expect(screen.queryByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN lets an unbreakable word wrap mid-word', () => {
        render(<ShowMoreText text={UNBREAKABLE_TEXT} limit={UNBREAKABLE_TEXT.length} />)

        expect(screen.getByText(UNBREAKABLE_TEXT)).toHaveClass('line-break-anywhere')
      })
    })
  })

  describe('GIVEN a text longer than the limit', () => {
    describe('WHEN the component renders', () => {
      it('THEN truncates it behind a "See more" button', () => {
        render(
          <ShowMoreText text={UNBREAKABLE_TEXT} limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT} />,
        )

        expect(screen.queryByText(UNBREAKABLE_TEXT)).not.toBeInTheDocument()
        expect(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN lets the truncated part wrap mid-word', () => {
        render(
          <ShowMoreText text={UNBREAKABLE_TEXT} limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT} />,
        )

        expect(
          screen.getByText(
            `${UNBREAKABLE_TEXT.substring(0, MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT)}...`,
          ),
        ).toHaveClass('line-break-anywhere')
      })
    })

    describe('WHEN the "See more" button is clicked', () => {
      it('THEN reveals the whole text and drops the button', async () => {
        render(
          <ShowMoreText text={UNBREAKABLE_TEXT} limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT} />,
        )

        await userEvent.click(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID))

        expect(screen.getByText(UNBREAKABLE_TEXT)).toHaveClass('line-break-anywhere')
        expect(screen.queryByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a custom showMore element', () => {
    describe('WHEN it is clicked', () => {
      it('THEN reveals the whole text', async () => {
        render(
          <ShowMoreText
            text={UNBREAKABLE_TEXT}
            limit={MAX_DESCRIPTION_LENGTH_DISPLAY_LIMIT}
            showMore={<button>Read it all</button>}
          />,
        )

        await userEvent.click(screen.getByRole('button', { name: 'Read it all' }))

        expect(screen.getByText(UNBREAKABLE_TEXT)).toBeInTheDocument()
      })
    })
  })
})
