import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
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

it('themes an existing button while preserving its props, ref, and event handlers', () => {
  const ref = createRef<HTMLButtonElement>()
  const onClick = jest.fn()
  const onBoundaryClick = jest.fn()

  render(
    <div aria-label="Items">
      <ColorTheme mode="dark" asChild className="boundary" onClick={onBoundaryClick}>
        <button ref={ref} className="item" aria-label="Themed item" onClick={onClick}>
          Content
        </button>
      </ColorTheme>
    </div>,
  )

  const item = screen.getByLabelText('Themed item')

  expect(screen.getByLabelText('Items').children).toHaveLength(1)
  expect(item.parentElement).toBe(screen.getByLabelText('Items'))
  expect(item.tagName).toBe('BUTTON')
  expect(item).toHaveAttribute('data-color-theme', 'dark')
  expect(item).toHaveClass('boundary', 'item')
  expect(ref.current).toBe(item)
  fireEvent.click(item)
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(onBoundaryClick).toHaveBeenCalledTimes(1)
})

it('updates slotted portal themes and preserves nested overrides without wrappers', () => {
  const portalRef = createRef<HTMLElement>()
  const content = (mode: 'light' | 'dark'): JSX.Element => (
    <ColorTheme mode={mode} asChild>
      <section aria-label="Outer">
        {createPortal(
          <ColorThemePortal asChild className="portal">
            <aside ref={portalRef} aria-label="Portal" className="child" />
          </ColorThemePortal>,
          document.body,
        )}
        <ColorTheme mode="light" asChild>
          <section aria-label="Nested">
            {createPortal(
              <ColorThemePortal asChild>
                <aside aria-label="Nested portal" />
              </ColorThemePortal>,
              document.body,
            )}
          </section>
        </ColorTheme>
      </section>
    </ColorTheme>
  )
  const { rerender, container } = render(content('dark'))
  const portal = screen.getByLabelText('Portal')

  expect(container.firstElementChild).toBe(screen.getByLabelText('Outer'))
  expect(portal.parentElement).toBe(document.body)
  expect(portal.tagName).toBe('ASIDE')
  expect(portalRef.current).toBe(portal)
  expect(portal).toHaveClass('portal', 'child')
  expect(portal).toHaveAttribute('data-color-theme', 'dark')
  expect(screen.getByLabelText('Nested portal')).toHaveAttribute('data-color-theme', 'light')
  rerender(content('light'))
  expect(portal).toHaveAttribute('data-color-theme', 'light')
  expect(screen.getByLabelText('Outer')).toHaveAttribute('data-color-theme', 'light')
})
