import { createContext, HTMLAttributes, useContext } from 'react'
import { createPortal } from 'react-dom'

import { V2ColorMode } from '~/styles/v2/colors'

const ThemeContext = createContext<V2ColorMode>('light')

export const useV2ColorTheme = () => useContext(ThemeContext)

export const V2Theme = ({
  mode,
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { mode: V2ColorMode }) => (
  <ThemeContext.Provider value={mode}>
    <div {...props} className={`v2-theme ${className}`} data-theme={mode}>
      {children}
    </div>
  </ThemeContext.Provider>
)

// Portals lose DOM inheritance: give only this subtree the same explicit theme.
export const V2Portal = ({ children }: { children: React.ReactNode }) => {
  const mode = useV2ColorTheme()

  return createPortal(<V2Theme mode={mode}>{children}</V2Theme>, document.body)
}
