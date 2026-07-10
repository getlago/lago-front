import { FC, Fragment } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { Link } from '~/core/router'

import { BreadcrumbItem } from './types'

export const BREADCRUMB_NAV_TEST_ID = 'breadcrumb-nav'

const BreadcrumbItemContent = ({ item }: { item: BreadcrumbItem }) => {
  if (item.loading) {
    return <Skeleton variant="text" className="w-20" />
  }

  if (item.path) {
    return (
      <Link to={item.path} className="shrink-0 no-underline hover:no-underline">
        <Typography variant="captionHl" color="primary600">
          {item.label}
        </Typography>
      </Link>
    )
  }

  return (
    <Typography variant="captionHl" color="grey600" className="shrink-0">
      {item.label}
    </Typography>
  )
}

/**
 * Breadcrumb — renders a horizontal trail of navigable links.
 *
 * Design rules (from Figma):
 * - Items with a path are clickable blue links; pathless items are grey static labels.
 * - Segments are separated by a "/" slash, same color as the links.
 * - Displayed above the entity name inside the header.
 */
export const Breadcrumb: FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1"
      data-test={BREADCRUMB_NAV_TEST_ID}
    >
      {items.map((item, index) => {
        return (
          <Fragment key={item.path ?? item.label}>
            {index > 0 && (
              <Typography variant="captionHl" color="primary600" className="shrink-0">
                /
              </Typography>
            )}
            <BreadcrumbItemContent item={item} />
          </Fragment>
        )
      })}
    </nav>
  )
}
