import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MutableRefObject } from 'react'

import { render } from '~/test-utils'

import { CREATE_MORE_SWITCH_TEST_ID, CreateMoreControl } from '../CreateMoreControl'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('CreateMoreControl', () => {
  describe('GIVEN a value ref owned by the drawer', () => {
    describe('WHEN the control first renders', () => {
      it('THEN starts unchecked without mutating the ref', () => {
        const valueRef: MutableRefObject<boolean> = { current: false }

        render(<CreateMoreControl valueRef={valueRef} />)

        expect(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID)).toBeInTheDocument()
        expect(valueRef.current).toBe(false)
      })
    })

    describe('WHEN the switch is toggled on', () => {
      it('THEN writes the live value into the ref', async () => {
        const valueRef: MutableRefObject<boolean> = { current: false }

        render(<CreateMoreControl valueRef={valueRef} />)

        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

        expect(valueRef.current).toBe(true)
      })
    })

    describe('WHEN the switch is toggled on then off', () => {
      it('THEN reports the ref back to false', async () => {
        const valueRef: MutableRefObject<boolean> = { current: false }

        render(<CreateMoreControl valueRef={valueRef} />)

        const toggle = screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID)

        await userEvent.click(toggle)
        await userEvent.click(toggle)

        expect(valueRef.current).toBe(false)
      })
    })
  })
})
