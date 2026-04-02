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

const defaultProps = {
  activeBackgroundColor: null,
  activeTextColor: null,
  onSelectBackground: jest.fn(),
  onSelectText: jest.fn(),
}

describe('ColorPicker', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the unified color picker', () => {
    describe('WHEN rendered', () => {
      it('THEN should display both background and text sections', () => {
        render(<ColorPicker {...defaultProps} />)

        expect(screen.getByText('Background')).toBeInTheDocument()
        expect(screen.getByText('Text')).toBeInTheDocument()
      })

      it('THEN should display 12 color swatches plus 2 clear buttons', () => {
        render(<ColorPicker {...defaultProps} />)

        const buttons = screen.getAllByRole('button')

        // 6 bg colors + 1 clear + 6 text colors + 1 clear = 14
        expect(buttons).toHaveLength(14)
      })

      it('THEN should display "A" labels on text color swatches', () => {
        render(<ColorPicker {...defaultProps} />)

        const labels = screen.getAllByText('A')

        expect(labels).toHaveLength(6)
      })
    })

    describe('WHEN clicking a background color swatch', () => {
      it('THEN should call onSelectBackground with the color value', async () => {
        const user = userEvent.setup()
        const onSelectBackground = jest.fn()

        render(<ColorPicker {...defaultProps} onSelectBackground={onSelectBackground} />)

        // "Red" appears twice (bg + text) — first one is the bg swatch
        const redButtons = screen.getAllByTitle('Red')

        await user.click(redButtons[0])

        expect(onSelectBackground).toHaveBeenCalledWith(red100)
      })
    })

    describe('WHEN clicking the background clear button', () => {
      it('THEN should call onSelectBackground with null', async () => {
        const user = userEvent.setup()
        const onSelectBackground = jest.fn()

        render(
          <ColorPicker
            {...defaultProps}
            activeBackgroundColor={red100}
            onSelectBackground={onSelectBackground}
          />,
        )

        await user.click(screen.getByTitle('Clear background'))

        expect(onSelectBackground).toHaveBeenCalledWith(null)
      })
    })

    describe('WHEN clicking a text color swatch', () => {
      it('THEN should call onSelectText with the color value', async () => {
        const user = userEvent.setup()
        const onSelectText = jest.fn()

        render(<ColorPicker {...defaultProps} onSelectText={onSelectText} />)

        // "Blue" appears twice — second one is the text swatch
        const blueButtons = screen.getAllByTitle('Blue')

        await user.click(blueButtons[1])

        expect(onSelectText).toHaveBeenCalledWith(blue600)
      })
    })

    describe('WHEN clicking the text clear button', () => {
      it('THEN should call onSelectText with null', async () => {
        const user = userEvent.setup()
        const onSelectText = jest.fn()

        render(
          <ColorPicker {...defaultProps} activeTextColor={blue600} onSelectText={onSelectText} />,
        )

        await user.click(screen.getByTitle('Clear text color'))

        expect(onSelectText).toHaveBeenCalledWith(null)
      })
    })

    describe('WHEN a background color is active', () => {
      it('THEN should display a checkmark on the active background swatch', () => {
        render(<ColorPicker {...defaultProps} activeBackgroundColor={red100} />)

        const redButtons = screen.getAllByTitle('Red')
        const svg = redButtons[0].querySelector('svg')

        expect(svg).toBeInTheDocument()
      })
    })

    describe('WHEN a text color is active', () => {
      it('THEN should display a checkmark on the active text swatch', () => {
        render(<ColorPicker {...defaultProps} activeTextColor={blue600} />)

        const blueButtons = screen.getAllByTitle('Blue')
        const svg = blueButtons[1].querySelector('svg')

        expect(svg).toBeInTheDocument()
      })
    })
  })
})
