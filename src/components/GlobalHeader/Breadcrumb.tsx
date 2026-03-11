import { FC, Fragment } from 'react'
import { Link } from 'react-router-dom'

import { Typography } from '~/components/designSystem/Typography'

import { BreadcrumbItem } from './types'

/**
 * Breadcrumb — renders a horizontal trail of navigable links.
 *
 * Design rules (from Figma):
 * - Every item is a clickable blue link (path is mandatory).
 * - Segments are separated by a "/" slash, same color as the links.
 * - Displayed above the entity name inside the header.
 */
export const Breadcrumb: FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-hidden">
      {items.map((item, index) => (
        <Fragment key={`breadcrumb-${index}`}>
          {index > 0 && (
            <Typography variant="captionHl" color="primary600" className="shrink-0">
              /
            </Typography>
          )}
          <Link to={item.path} className="shrink-0 no-underline hover:no-underline">
            <Typography variant="captionHl" color="primary600">
              {item.label}
            </Typography>
          </Link>
        </Fragment>
      ))}
    </nav>
  )
}
