import { Icon } from 'lago-design-system'
import { FC } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Status } from '~/components/designSystem/Status'
import { Typography } from '~/components/designSystem/Typography'

import { GlobalHeaderEntityConfig } from './types'

/**
 * Entity section rendered below the sticky header bar.
 * Owns all visual rendering — pages pass only data props.
 */
export const EntitySection: FC<{ entity?: GlobalHeaderEntityConfig; isLoading?: boolean }> = ({
  entity,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <>
        <Skeleton variant="text" className="w-50" />
        <Skeleton variant="text" className="w-32" />
      </>
    )
  }

  if (!entity) return null

  return (
    <>
      {entity.icon && (
        <Avatar variant="connector" size="large">
          <Icon name={entity.icon} color="dark" size="large" />
        </Avatar>
      )}
      <div>
        <div className="flex items-center gap-2">
          <Typography color="textSecondary" variant="headline" forceBreak>
            {entity.viewName}
          </Typography>
          {entity.badges?.map((badge, i) => (
            <Status
              key={i}
              type={badge.type}
              label={badge.label}
              labelVariables={badge.labelVariables}
            />
          ))}
        </div>
        {entity.metadata && <Typography>{entity.metadata}</Typography>}
      </div>
    </>
  )
}
