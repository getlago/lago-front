import { createContext, HTMLAttributes, useContext } from 'react'

import { RenderChild } from '../lib/render-child'

export type ColorMode = 'light' | 'dark'

type ThemeElementProps = HTMLAttributes<HTMLElement> & { asChild?: boolean }
type ColorThemeProps = ThemeElementProps & { mode: ColorMode }
const ColorThemeContext = createContext<ColorMode>('light')

export const ColorTheme = ({ mode, asChild = false, ...props }: ColorThemeProps): JSX.Element => {
  const Comp = asChild ? RenderChild : 'div'

  return (
    <ColorThemeContext.Provider value={mode}>
      <Comp {...props} data-color-theme={mode} />
    </ColorThemeContext.Provider>
  )
}

export const ColorThemePortal = ({ asChild = false, ...props }: ThemeElementProps): JSX.Element => {
  const mode = useContext(ColorThemeContext)
  const Comp = asChild ? RenderChild : 'div'

  return <Comp {...props} data-color-theme={mode} />
}
