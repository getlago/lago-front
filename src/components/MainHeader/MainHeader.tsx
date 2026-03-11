import { FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

import { ActionsBlock } from './ActionRenderer'
import { Breadcrumb } from './Breadcrumb'
import { EntitySection } from './EntitySection'
import { useMainHeaderReader } from './MainHeaderContext'
import { NavigationTabBar } from './NavigationTabBar'

/**
 * MainHeader — layout-level component that reads from MainHeaderContext.
 *
 * Two layout modes:
 * 1. Breadcrumb mode — breadcrumb + entity + actions (responsive)
 * 2. Fallback mode — sticky top bar with title + actions (legacy / unmigrated pages)
 */
export const MainHeaderComponent: FC = () => {
  const { config } = useMainHeaderReader()
  const navigate = useNavigate()

  if (!config) return null

  const { breadcrumb, backButton, title, actions, entity, tabs, filtersSection, isLoading } = config

  const hasBreadcrumb = breadcrumb && breadcrumb.length > 0
  const hasEntity = !!entity || isLoading

  return (
    <header>
      {/* TODO: remove this once all pages are migrated to breadcrumb pattern */}
      {backButton && !hasBreadcrumb ? (
        <>
          <div
            className={tw(
              'sticky top-0 z-navBar flex h-nav min-h-nav items-center justify-between gap-4 bg-white px-4 shadow-b md:px-12',
              'pl-17',
            )}
          >
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
                  data-test="main-header-title"
                >
                  {title}
                </Typography>
              )}
            </div>

            <ActionsBlock actions={actions} isLoading={isLoading} />
          </div>

          {/* Entity section below the fallback top bar */}
          {hasEntity && (
            <div className="px-12 pt-12">
              <EntitySection entity={entity} isLoading={isLoading} />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Breadcrumb layout — sticky on mobile, flat on desktop */}
          <div
            className={tw(
              'sticky top-0 z-navBar flex h-nav min-h-nav items-center justify-between gap-4 bg-white pl-17 pr-4 shadow-b md:pl-12',
              'lg:static lg:h-auto lg:min-h-0 lg:items-start lg:gap-2 lg:px-12 lg:pt-12 lg:shadow-none',
            )}
          >
            <div className="min-w-0">
              {hasBreadcrumb && <Breadcrumb items={breadcrumb} />}

              {/* Desktop — entity inline below breadcrumb */}
              {hasEntity && (
                <div className="hidden lg:block">
                  <EntitySection entity={entity} isLoading={isLoading} />
                </div>
              )}
            </div>

            <ActionsBlock actions={actions} isLoading={isLoading} />
          </div>

          {/* Mobile — entity section below the sticky bar */}
          {hasEntity && (
            <div className="px-12 pt-12 lg:hidden">
              <EntitySection entity={entity} isLoading={isLoading} />
            </div>
          )}
        </>
      )}

      {/* Tab bar */}
      {tabs && tabs.length >= 2 && <NavigationTabBar className="mx-12 mt-6" tabs={tabs} />}

      {/* Filter section */}
      {filtersSection && <div className="mt-6 px-12 pb-4">{filtersSection}</div>}
    </header>
  )
}
