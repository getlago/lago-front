import { IconName } from 'lago-design-system'
import { ReactNode } from 'react'

import { ButtonVariant } from '~/components/designSystem/Button'
import { StatusLabel, StatusType } from '~/components/designSystem/Status'
import { TranslateData } from '~/core/translations'

import { NavigationTabBarItem } from './NavigationTabBar'

// ─── Tab with content ────────────────────────────────────────────

/**
 * Unified tab definition: bar metadata + content in a single object.
 * Pages define one array, MainHeader picks the bar metadata,
 * and the page resolves the active content — single source of truth.
 */
export type MainHeaderTab = NavigationTabBarItem & {
  content: ReactNode
}

// ─── Action types ───────────────────────────────────────────────

/** Primary button with chevron-down that opens a dropdown menu */
export interface MainHeaderDropdownAction {
  type: 'dropdown'
  label: string
  items: MainHeaderDropdownItem[]
  dataTest?: string
}

export interface MainHeaderDropdownItem {
  label: string
  onClick: (closePopper: () => void) => void | Promise<void>
  disabled?: boolean
  hidden?: boolean
  danger?: boolean
  dataTest?: string
}

/** Grey/inline button that performs an action in the current view */
export interface MainHeaderInPageAction {
  type: 'action'
  label: string
  onClick: () => void | Promise<void>
  variant?: ButtonVariant
  startIcon?: IconName
  disabled?: boolean
  dataTest?: string
}

export type MainHeaderAction = MainHeaderDropdownAction | MainHeaderInPageAction

// ─── Entity config ──────────────────────────────────────────────

export interface MainHeaderBadge {
  type: StatusType
  label: StatusLabel | string
  labelVariables?: TranslateData
}

export interface MainHeaderEntityConfig {
  /** Display name — rendered as headline Typography */
  viewName: string
  /** Secondary text below the name (e.g. externalId, amount) */
  metadata?: string
  /** Status badges displayed next to the entity name */
  badges?: MainHeaderBadge[]
  /** Arbitrary icon rendered in a connector Avatar (e.g. integrations) */
  icon?: IconName
}

// ─── Main config ────────────────────────────────────────────────

export interface MainHeaderConfig {
  /** Temporary back button — will be replaced by breadcrumb system */
  backButton?: {
    path: string
  }

  /** Main title displayed in the sticky header bar — styling is handled by MainHeader */
  title?: string

  /** Action buttons rendered on the right side of the sticky header */
  actions?: MainHeaderAction[]

  /** Entity section — viewName is the page/entity heading */
  entity: MainHeaderEntityConfig

  /** Tab definitions — each tab declares bar metadata AND content in a single object */
  tabs?: MainHeaderTab[]

  /** Filter — pages include their own providers */
  filtersSection?: ReactNode

  /** Global loading state — shows skeletons for title and entity */
  isLoading?: boolean
}
