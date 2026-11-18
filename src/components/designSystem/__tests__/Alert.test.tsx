import { fireEvent, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { Alert } from '../Alert'

const ALERT_BUTTON_TEST_ID = 'alert-button'

const getAlert = (type: string): HTMLElement => screen.getByTestId(`alert-type-${type}`)

describe('Alert', () => {
  describe('GIVEN no tone is passed', () => {
    describe.each([
      { type: 'info', background: 'bg-purple-100' },
      { type: 'success', background: 'bg-green-100' },
      { type: 'danger', background: 'bg-red-100' },
      { type: 'warning', background: 'bg-yellow-100' },
    ] as const)('WHEN the type is $type', ({ type, background }) => {
      it(`THEN should render the light ${background} background only`, () => {
        render(<Alert type={type}>Message</Alert>)

        expect(getAlert(type)).toHaveClass(background)
        expect(getAlert(type).className).not.toMatch(/bg-\w+-800/)
        expect(getAlert(type).firstElementChild).not.toHaveClass('flex-wrap')
      })
    })

    describe('WHEN a button is configured', () => {
      it('THEN should render the dark quaternary button', () => {
        render(
          <Alert type="info" ButtonProps={{ label: 'Action', onClick: jest.fn() }}>
            Message
          </Alert>,
        )

        expect(screen.getByRole('button')).toHaveClass('button-quaternary-dark')
        expect(screen.getByRole('button')).not.toHaveClass('button-quaternary-light')
      })
    })
  })

  describe('GIVEN the dark tone', () => {
    describe.each([
      { type: 'info', background: 'bg-purple-800', light: 'bg-purple-100' },
      { type: 'success', background: 'bg-green-800', light: 'bg-green-100' },
      { type: 'danger', background: 'bg-red-800', light: 'bg-red-100' },
      { type: 'warning', background: 'bg-yellow-800', light: 'bg-yellow-100' },
    ] as const)('WHEN the type is $type', ({ type, background, light }) => {
      it(`THEN should replace the light background with ${background}`, () => {
        render(
          <Alert type={type} tone="dark">
            Message
          </Alert>,
        )

        expect(getAlert(type)).toHaveClass(background)
        expect(getAlert(type)).not.toHaveClass(light)
      })
    })

    describe('WHEN rendered', () => {
      it('THEN should render a white icon', () => {
        render(
          <Alert type="info" tone="dark">
            Message
          </Alert>,
        )

        expect(getAlert('info').querySelector('svg')).toHaveClass('text-white')
      })

      it('THEN should let the button wrap under the message when space runs out', () => {
        render(
          <Alert type="info" tone="dark">
            Message
          </Alert>,
        )

        const row = getAlert('info').firstElementChild as HTMLElement

        expect(row).toHaveClass('flex-wrap')
        expect(row.firstElementChild).toHaveClass('min-w-0', 'flex-[1_1_16rem]')
      })
    })

    describe('WHEN a button is configured', () => {
      it('THEN should render the light quaternary button and forward its data-test and click', () => {
        const onClick = jest.fn()

        render(
          <Alert
            type="info"
            tone="dark"
            ButtonProps={{ label: 'Action', onClick, 'data-test': ALERT_BUTTON_TEST_ID }}
          >
            Message
          </Alert>,
        )

        const button = screen.getByTestId(ALERT_BUTTON_TEST_ID)

        expect(button).toHaveClass('button-quaternary-light')
        expect(button).not.toHaveClass('button-quaternary-dark')

        fireEvent.click(button)

        expect(onClick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a button without a click handler', () => {
    describe('WHEN rendered', () => {
      it('THEN should not render the button', () => {
        render(
          <Alert type="info" tone="dark" ButtonProps={{ label: 'Action' }}>
            Message
          </Alert>,
        )

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })
  })
})
