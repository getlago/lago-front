import { Slot } from '@radix-ui/react-slot'
import { createContext, HTMLAttributes, useContext } from 'react'

export type ColorMode = 'light' | 'dark'

type ThemeElementProps = HTMLAttributes<HTMLElement> & { asChild?: boolean }
type ColorThemeProps = ThemeElementProps & { mode: ColorMode }
const ColorThemeContext = createContext<ColorMode>('light')

export const ColorTheme = ({ mode, asChild = false, ...props }: ColorThemeProps): JSX.Element => {
  const Comp = asChild ? Slot : 'div'

  return (
    <ColorThemeContext.Provider value={mode}>
      <Comp {...props} data-color-theme={mode} />
    </ColorThemeContext.Provider>
  )
}

export const ColorThemePortal = ({ asChild = false, ...props }: ThemeElementProps): JSX.Element => {
  const mode = useContext(ColorThemeContext)
  const Comp = asChild ? Slot : 'div'

  return <Comp {...props} data-color-theme={mode} />
}
