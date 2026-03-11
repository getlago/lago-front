import { GlobalHeaderComponent } from './GlobalHeader'
import { GlobalHeaderConfigure } from './GlobalHeaderConfigure'

export const GlobalHeader = Object.assign(GlobalHeaderComponent, {
  Configure: GlobalHeaderConfigure,
})

export { useGlobalHeaderTabContent } from './useGlobalHeaderTabContent'
export { GlobalHeaderProvider } from './GlobalHeaderContext'
export type {
  GlobalHeaderAction,
  GlobalHeaderBadge,
  GlobalHeaderConfig,
  GlobalHeaderDropdownAction,
  GlobalHeaderDropdownItem,
  GlobalHeaderEntityConfig,
  GlobalHeaderInPageAction,
  GlobalHeaderTab,
} from './types'
