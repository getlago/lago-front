import { AnalyticsDashboard, AnalyticsTab, AnalyticsView } from './types'

export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const viewSlugs = (dashboard: AnalyticsDashboard): Map<string, string> => {
  const views = dashboard.tabs.flatMap((tab) => tab.views)
  const counts = new Map<string, number>()

  views.forEach((view) => {
    const slug = slugify(view.title)

    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  })

  return new Map(
    views.map((view) => {
      const slug = slugify(view.title)

      return [view.id, slug && counts.get(slug) === 1 ? slug : view.id]
    }),
  )
}

export const findView = (
  dashboard: AnalyticsDashboard,
  slugs: Map<string, string>,
  segment: string | undefined,
): { tab: AnalyticsTab | undefined; view: AnalyticsView | undefined } => {
  for (const tab of dashboard.tabs) {
    const view = tab.views.find(
      (item) => segment && (slugs.get(item.id) === segment || item.id === segment),
    )

    if (view) return { tab, view }
  }

  const tab = dashboard.tabs[0]

  return { tab, view: tab?.views[0] }
}
