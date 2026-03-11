import { IconName } from 'lago-design-system'
import { ReactNode } from 'react'

import { StatusLabel, StatusType } from '~/components/designSystem/Status'
import { TranslateData } from '~/core/translations'

import { NavigationTabBarItem } from './NavigationTabBar'

// ─── Tab with content ────────────────────────────────────────────

/**
 * Unified tab definition: bar metadata + content in a single object.
 * Pages define one array, GlobalHeader picks the bar metadata,
 * and the page resolves the active content — single source of truth.
 */
export type GlobalHeaderTab = NavigationTabBarItem & {
  content: ReactNode
}

// ─── Action types ───────────────────────────────────────────────

/** Primary button with chevron-down that opens a dropdown menu */
export interface GlobalHeaderDropdownAction {
  type: 'dropdown'
  label: string
  items: GlobalHeaderDropdownItem[]
  dataTest?: string
}

export interface GlobalHeaderDropdownItem {
  label: string
  onClick: (closePopper: () => void) => void | Promise<void>
  disabled?: boolean
  hidden?: boolean
  danger?: boolean
  dataTest?: string
}

/** Grey/inline button that performs an action in the current view */
export interface GlobalHeaderInPageAction {
  type: 'action'
  label: string
  onClick: () => void | Promise<void>
  variant?: 'secondary' | 'inline'
  startIcon?: IconName
  disabled?: boolean
  dataTest?: string
}

export type GlobalHeaderAction = GlobalHeaderDropdownAction | GlobalHeaderInPageAction

// ─── Entity config ──────────────────────────────────────────────

export interface GlobalHeaderBadge {
  type: StatusType
  label: StatusLabel | string
  labelVariables?: TranslateData
}

export interface GlobalHeaderEntityConfig {
  /** Display name — rendered as headline Typography */
  viewName: string
  /** Secondary text below the name (e.g. externalId, amount) */
  metadata?: string
  /** Status badges displayed next to the entity name */
  badges?: GlobalHeaderBadge[]
  /** Arbitrary icon rendered in a connector Avatar (e.g. integrations) */
  icon?: IconName
}

// ─── Main config ────────────────────────────────────────────────

export interface GlobalHeaderConfig {
  /** Temporary back button — will be replaced by breadcrumb system */
  backButton?: {
    path: string
  }

  /** Main title displayed in the sticky header bar — styling is handled by GlobalHeader */
  title?: string

  /** Action buttons rendered on the right side of the sticky header */
  actions?: GlobalHeaderAction[]

  /** Entity section below the sticky header (avatar, name, metadata, badges) */
  entity?: GlobalHeaderEntityConfig

  /** Tab definitions — each tab declares bar metadata AND content in a single object */
  tabs?: GlobalHeaderTab[]

  /** Global loading state — shows skeletons for title and entity */
  isLoading?: boolean
}
