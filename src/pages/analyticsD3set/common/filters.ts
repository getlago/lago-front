import { keyWithPrefix } from '~/components/Filters/graphql/utils'

import { AnalyticsFilter, AnalyticsFilterValues, AnalyticsTab, AnalyticsView } from './types'

export const TIME_SEPARATOR = ','

export const filterDefault = (filter: AnalyticsFilter): string[] => {
  if (filter.default === null || filter.default === undefined) return []

  return Array.isArray(filter.default) ? filter.default : [filter.default]
}

export const filtersOfView = (
  filters: AnalyticsFilter[],
  tab: AnalyticsTab,
  view: AnalyticsView,
): AnalyticsFilter[] => {
  const seen = new Set<string>()

  return filters.filter((filter) => {
    if (filter.tab !== tab.id && filter.tab !== view.id) return false
    if (seen.has(filter.param)) return false
    seen.add(filter.param)

    return true
  })
}

/** Each filter's value: the URL's when it has the key (an empty value means none), else the default. */
export const readFilterValues = (
  searchParams: URLSearchParams,
  filters: AnalyticsFilter[],
  prefix: string,
): AnalyticsFilterValues =>
  filters.reduce<AnalyticsFilterValues>((acc, filter) => {
    const key = keyWithPrefix(filter.param, prefix)

    if (!searchParams.has(key)) return { ...acc, [filter.param]: filterDefault(filter) }

    return { ...acc, [filter.param]: searchParams.getAll(key).filter((value) => value !== '') }
  }, {})

const sameValues = (a: string[], b: string[]): boolean =>
  a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index])

export const writeFilterValue = (
  searchParams: URLSearchParams,
  prefix: string,
  filter: AnalyticsFilter,
  values: string[],
): URLSearchParams => {
  const next = new URLSearchParams(searchParams)
  const key = keyWithPrefix(filter.param, prefix)

  next.delete(key)
  next.delete(keyWithPrefix('page', prefix))

  if (sameValues(values, filterDefault(filter))) return next
  if (!values.length) {
    next.set(key, '')

    return next
  }
  values.forEach((value) => next.append(key, value))

  return next
}

export const resetFilterValues = (
  searchParams: URLSearchParams,
  prefix: string,
): URLSearchParams => {
  const next = new URLSearchParams(searchParams)

  Array.from(next.keys())
    .filter((key) => key.startsWith(`${prefix}_`))
    .forEach((key) => next.delete(key))

  return next
}

export const hasFilterValues = (searchParams: URLSearchParams, prefix: string): boolean =>
  Array.from(searchParams.keys()).some((key) => key.startsWith(`${prefix}_`))

export const splitTimeValue = (value: string | undefined): { from: string; to: string } => {
  const [from = '', to = ''] = (value ?? '').split(TIME_SEPARATOR)

  return { from, to }
}

export const joinTimeValue = (from: string, to: string): string[] =>
  from || to ? [`${from}${TIME_SEPARATOR}${to}`] : []
