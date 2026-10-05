import { render, screen } from '@testing-library/react'
import { createPortal } from 'react-dom'

import { ColorTheme, ColorThemePortal } from '../color-theme'

it('propagates nested modes into portals and defaults standalone portals to light', () => {
  render(
    <>
      <ColorThemePortal aria-label="Standalone" />
      <ColorTheme mode="dark" aria-label="Dark boundary">
        {createPortal(<ColorThemePortal aria-label="Dark portal" />, document.body)}
        <ColorTheme mode="light" aria-label="Light boundary">
          {createPortal(<ColorThemePortal aria-label="Light portal" />, document.body)}
        </ColorTheme>
      </ColorTheme>
    </>,
  )
  expect(screen.getByLabelText('Standalone')).toHaveAttribute('data-color-theme', 'light')
  expect(screen.getByLabelText('Dark portal')).toHaveAttribute('data-color-theme', 'dark')
  expect(screen.getByLabelText('Light portal')).toHaveAttribute('data-color-theme', 'light')
  expect(screen.getByLabelText('Dark portal').parentElement).toBe(document.body)
})
