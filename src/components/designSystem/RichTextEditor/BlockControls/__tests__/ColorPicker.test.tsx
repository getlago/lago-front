import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import ColorPicker from '../ColorPicker'

describe('ColorPicker', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the background variant', () => {
    describe('WHEN rendered', () => {
      it('THEN should display 8 color swatches plus a clear button', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={null} onSelect={onSelect} />)

        const buttons = screen.getAllByRole('button')

        // 8 colors + 1 clear button
        expect(buttons).toHaveLength(9)
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

        render(<ColorPicker variant="background" activeColor="#fee2e2" onSelect={onSelect} />)

        await user.click(screen.getByTitle('Clear'))

        expect(onSelect).toHaveBeenCalledWith(null)
      })
    })

    describe('WHEN clicking a color swatch', () => {
      it('THEN should call onSelect with the color value', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor={null} onSelect={onSelect} />)

        await user.click(screen.getByTitle('Red'))

        expect(onSelect).toHaveBeenCalledWith('#fee2e2')
      })
    })

    describe('WHEN a color is active', () => {
      it('THEN should display a checkmark on the active swatch', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor="#fee2e2" onSelect={onSelect} />)

        // The active swatch should contain an SVG checkmark icon
        const redButton = screen.getByTitle('Red')
        const svg = redButton.querySelector('svg')

        expect(svg).toBeInTheDocument()
      })

      it('THEN should not display a checkmark on inactive swatches', () => {
        const onSelect = jest.fn()

        render(<ColorPicker variant="background" activeColor="#fee2e2" onSelect={onSelect} />)

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

        // Each text color swatch has an "A" label
        const labels = screen.getAllByText('A')

        expect(labels).toHaveLength(8)
      })
    })

    describe('WHEN clicking a text color swatch', () => {
      it('THEN should call onSelect with the text color value', async () => {
        const user = userEvent.setup()
        const onSelect = jest.fn()

        render(<ColorPicker variant="text" activeColor={null} onSelect={onSelect} />)

        await user.click(screen.getByTitle('Blue'))

        expect(onSelect).toHaveBeenCalledWith('#2563eb')
      })
    })
  })
})
