import { FC } from 'react'

import { ActionsBlock } from './ActionRenderer'
import { Breadcrumb } from './Breadcrumb'
import { EntitySection } from './EntitySection'
import { MainHeaderConfigure } from './MainHeaderConfigure'
import { useMainHeaderReader } from './MainHeaderContext'
import { MAIN_HEADER_FILTERS_TEST_ID, MAIN_HEADER_TEST_ID } from './mainHeaderTestIds'
import { NavigationTabBar } from './NavigationTabBar'

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
    <>
      {/* Mobile top bar — sticky, outside header to stay fixed on scroll */}
      <div className="sticky top-0 z-navBar flex h-nav min-h-nav items-center gap-4 bg-white pl-17 pr-4 shadow-b md:hidden">
        {hasBreadcrumb && <Breadcrumb items={breadcrumb} />}
        <div className="ml-auto">
          <ActionsBlock actions={actions} isLoading={isLoading} />
        </div>
      </div>

      <header data-test={MAIN_HEADER_TEST_ID}>
        {/* Desktop layout — entity + actions inline */}
        <div className="hidden px-12 pt-12 md:flex md:items-start md:justify-between md:gap-4">
          <div className="min-w-0">
            {hasBreadcrumb && <Breadcrumb items={breadcrumb} />}

            {hasEntity && (
              <div className="pb-6">
                <EntitySection entity={entity} isLoading={isLoading} />
              </div>
            )}
          </div>

          <ActionsBlock actions={actions} isLoading={isLoading} />
        </div>

        {/* Mobile — entity section below the sticky bar */}
        {hasEntity && (
          <div className="px-12 pb-4 pt-12 md:hidden">
            <EntitySection entity={entity} isLoading={isLoading} />
          </div>
        )}

        {/* Tab bar */}
        {tabs && tabs.length >= 2 && <NavigationTabBar className="mx-12" tabs={tabs} />}

        {/* Filter section */}
        {filtersSection && (
          <div className="px-12 pb-4" data-test={MAIN_HEADER_FILTERS_TEST_ID}>
            {filtersSection}
          </div>
        )}
      </header>
    </>
  )
}

export const MainHeader = Object.assign(MainHeaderComponent, {
  Configure: MainHeaderConfigure,
})
