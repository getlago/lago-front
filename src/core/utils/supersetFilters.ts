import { isNil } from 'lodash'

import { SUPERSET_FILTERS_LS_KEY_PREFIX } from '~/core/constants/localStorageKeys'

type DataMaskEntry = {
  filterState?: Record<string, unknown>
}

type NativeFilters = Record<string, { filterState: Record<string, unknown> }>

/**
 * Builds the localStorage key used to persist a Superset dashboard's native
 * filters. The key is scoped both by org (cross-tab/cross-org safety) and by
 * dashboard, so distinct dashboards don't read/write each other's filter
 * state. The dashboard title is used (slugified) rather than its server id,
 * which is regenerated when dashboards are recreated on deployments.
 */
export function getSupersetFiltersLsKey(orgId: string, dashboardTitle: string): string {
  const slug = dashboardTitle.toLowerCase().split(' ').join('-')

  return `${SUPERSET_FILTERS_LS_KEY_PREFIX}${orgId}-${slug}`
}

export function extractNativeFilters(dataMask: Record<string, unknown>): NativeFilters {
  return Object.entries(dataMask).reduce<NativeFilters>((acc, [key, entry]) => {
    const filterState = (entry as DataMaskEntry)?.filterState
    const val = filterState?.value

    if (
      key.startsWith('NATIVE_FILTER-') &&
      filterState &&
      !isNil(val) &&
      !(Array.isArray(val) && val.length === 0)
    ) {
      acc[key] = { filterState }
    }

    return acc
  }, {})
}
