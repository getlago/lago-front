import { FC } from 'react'

import { tw } from '~/styles/utils'

import { ActionsBlock } from './ActionRenderer'
import { Breadcrumb } from './Breadcrumb'
import { EntitySection } from './EntitySection'
import { MainHeaderConfigure } from './MainHeaderConfigure'
import { useMainHeaderReader } from './MainHeaderContext'
import { NavigationTabBar } from './NavigationTabBar'

export const MAIN_HEADER_TEST_ID = 'main-header'
export const MAIN_HEADER_FILTERS_TEST_ID = 'main-header-filters'

/**
 * MainHeader — layout-level component that reads from MainHeaderContext.
 * Renders the actual header based on the config provided by the nearest <MainHeader.Configure>.
 */
const MainHeaderComponent: FC = () => {
  const { config } = useMainHeaderReader()

  if (!config) return null

  const { breadcrumb, actions, entity, tabs, filtersSection, isLoading } = config

  const hasBreadcrumb = breadcrumb && breadcrumb.length > 0
  const hasEntity = !!entity || isLoading

  return (
    <header data-test={MAIN_HEADER_TEST_ID}>
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
        <div className="px-12 pb-4 pt-12 lg:hidden">
          <EntitySection entity={entity} isLoading={isLoading} />
        </div>
      )}

      {/* Tab bar */}
      {tabs && tabs.length >= 2 && <NavigationTabBar className="mx-12 mt-2" tabs={tabs} />}

      {/* Filter section */}
      {filtersSection && (
        <div className="mt-4 px-12 pb-4" data-test={MAIN_HEADER_FILTERS_TEST_ID}>
          {filtersSection}
        </div>
      )}
    </header>
  )
}

export const MainHeader = Object.assign(MainHeaderComponent, {
  Configure: MainHeaderConfigure,
})
