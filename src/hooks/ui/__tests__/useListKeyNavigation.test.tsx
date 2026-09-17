import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useKeyNavigationOptions, useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

interface PageWrapperProps {
  conponentProps: useKeyNavigationOptions
  itemCount: number
}

// The handler belongs on each item, as the design-system Table wires it: that is
// what makes `e.currentTarget` the item the keystroke came from.
const MyTestComponentThatUsesNavigation = ({ conponentProps, itemCount }: PageWrapperProps) => {
  const { onKeyDown } = useListKeysNavigation(conponentProps)

  return (
    <div>
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-static-element-interactions */}
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={`item-${index}`}
          tabIndex={0}
          id={`item-${index}`}
          data-id={`model-id-${index}`}
          onKeyDown={onKeyDown}
        >
          {index}
        </div>
      ))}
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-static-element-interactions */}
    </div>
  )
}

describe('useListKeyNavigation()', () => {
  describe('disabled', () => {
    const action = jest.fn()
    const disabled = true

    it('does not return', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: action,
            navigate: action,
            disabled: disabled,
          }}
          itemCount={2}
        />,
      )

      document?.getElementById('item-0')?.focus()

      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{j}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{k}')
      await userEvent.keyboard('{Enter}')

      expect(action).not.toHaveBeenCalled()
    })
  })

  describe('Pressing ArrowDown or j', () => {
    const navigate = jest.fn()
    const disabled = false

    it('focuses the next element', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: (i) => `item-${i}`,
            navigate: navigate,
            disabled: disabled,
          }}
          itemCount={3}
        />,
      )

      document?.getElementById('item-0')?.focus()
      expect(document?.activeElement?.id).toEqual('item-0')

      await userEvent.keyboard('{ArrowDown}')
      expect(document?.activeElement?.id).toEqual('item-1')

      await userEvent.keyboard('{j}')
      expect(document?.activeElement?.id).toEqual('item-2')

      expect(navigate).not.toHaveBeenCalled()
    })

    it('returns if no next element to focus', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: (i) => `item-${i}`,
            navigate: navigate,
            disabled: disabled,
          }}
          itemCount={1}
        />,
      )

      document?.getElementById('item-0')?.focus()
      expect(document?.activeElement?.id).toEqual('item-0')

      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{j}')

      expect(document?.activeElement?.id).toEqual('item-0')
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe('Pressing ArrowUp or k', () => {
    const navigate = jest.fn()
    const disabled = false

    it('focuses the next element', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: (i) => `item-${i}`,
            navigate: navigate,
            disabled: disabled,
          }}
          itemCount={3}
        />,
      )

      document?.getElementById('item-2')?.focus()
      expect(document?.activeElement?.id).toEqual('item-2')

      await userEvent.keyboard('{ArrowUp}')
      expect(document?.activeElement?.id).toEqual('item-1')

      await userEvent.keyboard('{k}')
      expect(document?.activeElement?.id).toEqual('item-0')

      expect(navigate).not.toHaveBeenCalled()
    })

    it('returns if no previous element to focus', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: (i) => `item-${i}`,
            navigate: navigate,
            disabled: disabled,
          }}
          itemCount={1}
        />,
      )

      document?.getElementById('item-0')?.focus()
      expect(document?.activeElement?.id).toEqual('item-0')

      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{k}')

      expect(document?.activeElement?.id).toEqual('item-0')
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe('Pressing Enter on second element', () => {
    const navigate = jest.fn((id) => id)
    const disabled = false

    it('triggers navigate method with correct argument', async () => {
      render(
        <MyTestComponentThatUsesNavigation
          conponentProps={{
            getElmId: (i) => `item-${i}`,
            navigate: navigate,
            disabled: disabled,
          }}
          itemCount={2}
        />,
      )

      document?.getElementById('item-0')?.focus()
      expect(document?.activeElement?.id).toEqual('item-0')

      await userEvent.keyboard('{j}')
      expect(document?.activeElement?.id).toEqual('item-1')

      await userEvent.keyboard('{Enter}')
      expect(document?.activeElement?.id).toEqual('item-1')
      expect(navigate).toHaveBeenCalled()
      expect(navigate.mock.results[0].value).toBe('model-id-1')
    })
  })
})
