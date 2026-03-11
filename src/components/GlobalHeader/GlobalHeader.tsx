import { FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

import { ActionRenderer } from './ActionRenderer'
import { EntitySection } from './EntitySection'
import { useGlobalHeaderReader } from './GlobalHeaderContext'
import { NavigationTabBar } from './NavigationTabBar'

/**
 * GlobalHeader — layout-level component that reads from GlobalHeaderContext.
 *
 * Renders null when no config is set (pages that haven't migrated yet).
 * When a page mounts <GlobalHeader.Configure>, this component renders:
 * - Sticky top bar with back button + title + actions
 * - Entity section (optional, non-sticky)
 * - Tab navigation (optional)
 */
export const GlobalHeaderComponent: FC = () => {
  const { config } = useGlobalHeaderReader()
  const navigate = useNavigate()

  // No config = no header (backward compatible with unmigrated pages)
  if (!config) return null

  const { backButton, title, actions, entity, tabs, isLoading } = config

  return (
    <header>
      {/* Sticky top bar */}
      <div
        className={tw(
          'sticky top-0 z-navBar flex h-nav min-h-nav items-center justify-between gap-4 bg-white px-4 shadow-b md:px-12',
          'pl-17',
        )}
      >
        {/* Left side: back button + title */}
        <div className="-m-1 flex items-center gap-4 overflow-hidden p-1">
          {backButton && (
            <Button
              icon="arrow-left"
              variant="quaternary"
              onClick={() => navigate(backButton.path)}
            />
          )}

          {isLoading && <Skeleton variant="text" className="w-30" />}
          {!isLoading && title && (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="global-header-title"
            >
              {title}
            </Typography>
          )}
        </div>

        {/* Right side: typed actions */}
        {actions && actions.length > 0 && (
          <div className="flex shrink-0 items-center gap-4">
            {actions.map((action, index) => (
              <ActionRenderer key={index} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Entity section (non-sticky, optional) — skeleton shown during loading */}
      {(entity || isLoading) && <EntitySection entity={entity} isLoading={isLoading} />}

      {/* Tab bar — hidden for 0-1 tabs, content resolved via useGlobalHeaderTabContent */}
      {tabs && tabs.length >= 2 && <NavigationTabBar className="mx-12" tabs={tabs} />}
    </header>
  )
}
