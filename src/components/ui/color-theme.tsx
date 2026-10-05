import { createContext, HTMLAttributes, useContext } from 'react'

import { ColorMode } from '~/styles/v2/colors'

type ColorThemeProps = HTMLAttributes<HTMLDivElement> & { mode: ColorMode }
const ColorThemeContext = createContext<ColorMode>('light')

export const ColorTheme = ({ mode, ...props }: ColorThemeProps): JSX.Element => (
  <ColorThemeContext.Provider value={mode}>
    <div {...props} data-color-theme={mode} />
  </ColorThemeContext.Provider>
)

export const ColorThemePortal = (props: HTMLAttributes<HTMLDivElement>): JSX.Element => {
  const mode = useContext(ColorThemeContext)

  return <div {...props} data-color-theme={mode} />
}
