import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import tailwindConfig from 'lago-configs/tailwind'
import resolveConfig from 'tailwindcss/resolveConfig'

import { render } from '~/test-utils'

import ColorPicker from '../ColorPicker'

const fullConfig = resolveConfig(tailwindConfig)
const themeColors = fullConfig.theme.colors
const red100 = (themeColors.red as Record<number, string>)[100]
const blue600 = (themeColors.blue as Record<number, string>)[600]

describe('ColorPicker', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the background variant', () => {
    describe('WHEN rendered', () => {
      it('THEN should display 6 color swatches plus a clear button', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={null} onSelect={onSelect} />)

        const buttons = screen.getAllByRole('button')

        // 6 colors + 1 clear button
        expect(buttons).toHaveLength(7)
      })

      it('THEN should display the clear button', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={null} onSelect={onSelect} />)

        expect(screen.getByTitle('Clear')).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the clear button', () => {
      it('THEN should call onSelect with null', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={red100} onSelect={onSelect} />)

        await user.click(screen.getByTitle('Clear'))

        expect(onSelect).toHaveBeenCalledWith(null)
      })
    })

    describe('WHEN clicking a color swatch', () => {
      it('THEN should call onSelect with the theme color value', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={null} onSelect={onSelect} />)

        await user.click(screen.getByTitle('Red'))

        expect(onSelect).toHaveBeenCalledWith(red100)
      })
    })

    describe('WHEN a color is active', () => {
      it('THEN should display a checkmark on the active swatch', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={red100} onSelect={onSelect} />)

        const redButton = screen.getByTitle('Red')
        const svg = redButton.querySelector('svg')

        expect(svg).toBeInTheDocument()
      })

      it('THEN should not display a checkmark on inactive swatches', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={red100} onSelect={onSelect} />)

        const blueButton = screen.getByTitle('Blue')
        const svg = blueButton.querySelector('svg')

        expect(svg).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the text variant', () => {
    describe('WHEN rendered', () => {
      it('THEN should display "A" labels on each color swatch', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="text" activeColor={null} onSelect={onSelect} />)

        const labels = screen.getAllByText('A')

        expect(labels).toHaveLength(6)
      })
    })

    describe('WHEN clicking a text color swatch', () => {
      it('THEN should call onSelect with the theme text color value', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()

        render(<ColorPicker variant="text" activeColor={null} onSelect={onSelect} />)

        await user.click(screen.getByTitle('Blue'))

        expect(onSelect).toHaveBeenCalledWith(blue600)
      })
    })
  })
})
