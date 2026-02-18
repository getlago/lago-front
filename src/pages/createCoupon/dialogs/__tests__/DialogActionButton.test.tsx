import { act, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { DialogActionButton, useSetDisabledRef } from '../DialogActionButton'

const SUBMIT_BUTTON_TEST_ID = 'submit-button'

const TestWrapper = () => {
  const setDisabledRef = useSetDisabledRef()

  return (
    <>
      <DialogActionButton
        label="Submit"
        setDisabledRef={setDisabledRef}
        data-test={SUBMIT_BUTTON_TEST_ID}
      />
      <button
        data-test="toggle-enabled"
        onClick={() => setDisabledRef.current(false)}
        type="button"
      >
        Enable
      </button>
    </>
  )
}

describe('DialogActionButton', () => {
  describe('GIVEN the component is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render a disabled submit button', () => {
        render(<TestWrapper />)

        const button = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('type', 'submit')
      })
    })

    describe('WHEN setDisabledRef is called with false', () => {
      it('THEN should enable the button', async () => {
        render(<TestWrapper />)

        const button = screen.getByTestId(SUBMIT_BUTTON_TEST_ID)

        expect(button).toBeDisabled()

        await act(async () => {
          screen.getByTestId('toggle-enabled').click()
        })

        expect(button).not.toBeDisabled()
      })
    })
  })
})
