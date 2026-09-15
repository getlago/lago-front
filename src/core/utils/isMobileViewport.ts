import { theme } from '~/styles/muiTheme'

export const isMobileViewport = (): boolean => window.innerWidth < theme.breakpoints.values.md
