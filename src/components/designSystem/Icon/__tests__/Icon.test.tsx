import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { Icon, IconColor, IconProps } from '../Icon'

describe('Icon', () => {
  describe('GIVEN only a name', () => {
    it('THEN should identify the glyph with the medium size in data-test and title', () => {
      render(<Icon name="plus" />)

      const icon = screen.getByTestId('plus/medium')

      expect(icon).toHaveAttribute('title', 'plus/medium')
      expect(icon).toHaveClass('text-inherit', 'size-4', 'min-w-4')
    })
  })

  describe('WHEN a size is given', () => {
    it.each<[NonNullable<IconProps['size']>, string[]]>([
      ['xsmall', ['size-2', 'min-w-2']],
      ['small', ['size-3', 'min-w-3']],
      ['medium', ['size-4', 'min-w-4']],
      ['large', ['size-6', 'min-w-6']],
    ])('THEN should apply the %s size classes', (size, classes) => {
      render(<Icon name="plus" size={size} />)

      expect(screen.getByTestId(`plus/${size}`)).toHaveClass(...classes)
    })
  })

  describe('WHEN a color is given', () => {
    it.each<[IconColor, string]>([
      ['primary', 'text-blue-600'],
      ['success', 'text-green-600'],
      ['error', 'text-red-600'],
      ['warning', 'text-yellow-600'],
      ['info', 'text-purple-600'],
      ['light', 'text-white'],
      ['black', 'text-grey-700'],
      ['dark', 'text-grey-600'],
      ['input', 'text-grey-500'],
      ['disabled', 'text-grey-400'],
      ['skeleton', 'text-grey-100'],
    ])('THEN should apply the %s color class', (color, className) => {
      render(<Icon name="plus" color={color} />)

      expect(screen.getByTestId('plus/medium')).toHaveClass(className)
    })
  })

  describe('WHEN an animation is given', () => {
    it.each<[NonNullable<IconProps['animation']>, string]>([
      ['spin', 'animate-spin'],
      ['pulse', 'animate-pulse'],
    ])('THEN should apply the %s animation class', (animation, className) => {
      render(<Icon name="processing" animation={animation} />)

      expect(screen.getByTestId('processing/medium')).toHaveClass(className)
    })
  })

  describe('WHEN a className conflicts with a variant', () => {
    it('THEN should let the className win', () => {
      render(<Icon name="plus" size="medium" className="size-6" />)

      const icon = screen.getByTestId('plus/medium')

      expect(icon).toHaveClass('size-6')
      expect(icon).not.toHaveClass('size-4')
    })
  })

  describe('GIVEN no onClick', () => {
    it('THEN should not show a pointer cursor', () => {
      render(<Icon name="plus" />)

      expect(screen.getByTestId('plus/medium')).not.toHaveClass('cursor-pointer')
    })
  })

  describe('GIVEN an onClick', () => {
    it('THEN should show a pointer cursor and call the handler when clicked', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()

      render(<Icon name="plus" onClick={onClick} />)

      const icon = screen.getByTestId('plus/medium')

      expect(icon).toHaveClass('cursor-pointer')

      await user.click(icon)

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN an icon inside a labelled button', () => {
    it('THEN should not add any text to the button accessible name', () => {
      render(
        <button type="button">
          <Icon name="plus" />
          Add
        </button>,
      )

      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    })
  })
})
