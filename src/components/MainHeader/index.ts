import { MainHeaderComponent } from './MainHeader'
import { MainHeaderConfigure } from './MainHeaderConfigure'

export const MainHeader = Object.assign(MainHeaderComponent, {
  Configure: MainHeaderConfigure,
})

export { useMainHeaderTabContent } from './useMainHeaderTabContent'
export { MainHeaderProvider } from './MainHeaderContext'
export type {
  MainHeaderAction,
  MainHeaderBadge,
  MainHeaderConfig,
  MainHeaderDropdownAction,
  MainHeaderDropdownItem,
  MainHeaderEntityConfig,
  MainHeaderInPageAction,
  MainHeaderTab,
} from './types'
