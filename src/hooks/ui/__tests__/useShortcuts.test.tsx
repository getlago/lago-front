import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Shortcut, useShortcuts, getCleanKey } from '../useShortcuts'

const MyTestComponentThatUsesShortcuts = ({ shortcuts }: { shortcuts: Shortcut[] }) => {
  useShortcuts(shortcuts)

  return null
}

describe('useShortcuts()', () => {
  describe('when Cmd D shortcut is enabled and Cmd+D is pressed', () => {
    let action = jest.fn()
    let shortcuts: Shortcut[] = [
      {
        action,
        keys: ['Cmd', 'KeyD'],
        disabled: false,
      },
    ]

    it('calls the action callback', () => {
      render(
        <div>
          <MyTestComponentThatUsesShortcuts shortcuts={shortcuts} />
        </div>
      )

      // cf: https://testing-library.com/docs/ecosystem-user-event#keyboardtext-options
      userEvent.keyboard('{Meta>}D{/Meta}')

      expect(action).toHaveBeenCalled()
    })
  })

  describe('when Cmd D shortcut is DISABLED and Cmd+D is pressed', () => {
    let action = jest.fn()
    let shortcuts: Shortcut[] = [
      {
        action,
        keys: ['Cmd', 'KeyD'],
        disabled: true,
      },
    ]

    it('does not call the action callback', () => {
      render(
        <div>
          <MyTestComponentThatUsesShortcuts shortcuts={shortcuts} />
        </div>
      )

      userEvent.keyboard('{Meta>}D{/Meta}')

      expect(action).not.toHaveBeenCalled()
    })
  })

  describe('when Cmd Enter shortcut is enabled and Cmd+Enter is pressed', () => {
    let action = jest.fn()
    let shortcuts: Shortcut[] = [
      {
        action,
        keys: ['Cmd', 'Enter'],
        disabled: false,
      },
    ]

    it('works.', () => {
      render(
        <div>
          <MyTestComponentThatUsesShortcuts shortcuts={shortcuts} />
        </div>
      )

      userEvent.keyboard('{Meta>}{Enter}{/Meta}')

      expect(action).toHaveBeenCalled()
    })
  })

  describe('getCleanKey()', () => {
    it('should clean keys correctly', () => {
      expect(getCleanKey('MetaLeft')).toEqual('Cmd')
      expect(getCleanKey('MetaRight')).toEqual('Cmd')
      expect(getCleanKey('AltLeft')).toEqual('Alt')
      expect(getCleanKey('AltRight')).toEqual('Alt')
      expect(getCleanKey('ControlLeft')).toEqual('Ctrl')
      expect(getCleanKey('ControlRight')).toEqual('Ctrl')
    })
  })
})
