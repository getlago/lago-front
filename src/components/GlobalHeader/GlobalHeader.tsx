import { FC } from 'react'

import { tw } from '~/styles/utils'

import { ActionRenderer } from './ActionRenderer'
import { Breadcrumb } from './Breadcrumb'
import { EntitySection } from './EntitySection'
import { useGlobalHeaderReader } from './GlobalHeaderContext'
import { NavigationTabBar } from './NavigationTabBar'

/**
 * GlobalHeader — layout-level component that reads from GlobalHeaderContext.
 *
 * Renders null when no config is set (pages that haven't migrated yet).
 * When a page mounts <GlobalHeader.Configure>, this component renders:
 *
 * ── Mobile (< lg) ──────────────────────────────────────────────
 *   ┌ sticky bar (h-nav, shadow-b, pl-17 for burger) ┐
 *   │  Breadcrumb                          [Actions]  │
 *   └─────────────────────────────────────────────────┘
 *   Entity Name (headline)  [badges]
 *   metadata
 *   ─── tabs ──────────────────────────────────────────
 *
 * ── Desktop (≥ lg) ─────────────────────────────────────────────
 *   Breadcrumb
 *   Entity Name (headline)  [badges]      [Actions]
 *   metadata
 *   ─── tabs ──────────────────────────────────────────
 */
export const GlobalHeaderComponent: FC = () => {
  const { config } = useGlobalHeaderReader()

  // No config = no header (backward compatible with unmigrated pages)
  if (!config) return null

  const { breadcrumb, actions, entity, tabs, isLoading } = config

  const hasBreadcrumb = breadcrumb && breadcrumb.length > 0
  const hasEntity = !!entity || isLoading

  return (
    <header>
      {/* Top bar — sticky on mobile, flat on desktop */}
      <div
        className={tw(
          // Mobile
          'sticky top-0 z-navBar flex h-nav min-h-nav items-center justify-between gap-4 bg-white pl-17 pr-4 shadow-b md:pl-12',
          // Desktop
          'lg:static lg:h-auto lg:min-h-0 lg:items-start lg:gap-2 lg:px-12 lg:pb-3 lg:pt-12 lg:shadow-none',
        )}
      >
        <div className="min-w-0">
          {hasBreadcrumb && <Breadcrumb items={breadcrumb} />}

          {/* Desktop only — entity inline below breadcrumb */}
          {hasEntity && (
            <div className="hidden lg:block">
              <EntitySection entity={entity} isLoading={isLoading} />
            </div>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex shrink-0 items-center justify-center gap-4">
            {actions.map((action, index) => (
              <ActionRenderer key={index} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile only — entity section below the sticky bar */}
      {hasEntity && (
        <div className="px-12 pt-12 lg:hidden">
          <EntitySection entity={entity} isLoading={isLoading} />
        </div>
      )}

      {/* Tab bar — hidden for 0-1 tabs, content resolved via useGlobalHeaderTabContent */}
      {tabs && tabs.length >= 2 && <NavigationTabBar className="mx-12" tabs={tabs} />}
    </header>
  )
}
