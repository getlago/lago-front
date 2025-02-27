import { FC, PropsWithChildren } from 'react'

import { Avatar, Icon, IconName, Skeleton, Typography } from '~/components/designSystem'
import { tw } from '~/styles/utils'

const DetailsPageContainer: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <div className={tw('flex max-w-168 flex-col gap-12 px-4 pb-20 md:px-12', className)}>
      {children}
    </div>
  )
}

const DetailsPageHeader: FC<{
  isLoading: boolean
  icon: IconName
  title: string | JSX.Element
  description: string
  className?: string
}> = ({ isLoading, icon, title, description, className }) => {
  if (isLoading) {
    return (
      <div className={tw('flex items-center gap-4 px-4 py-8 shadow-b md:px-12', className)}>
        <Skeleton variant="connectorAvatar" size="large" />
        <div className="flex flex-col gap-1">
          <Skeleton variant="text" className="mb-1 w-40" />
          <Skeleton variant="text" className="w-50" />
        </div>
      </div>
    )
  }

  return (
    <div className={tw('flex items-center gap-4 px-4 py-8 shadow-b md:px-12', className)}>
      <Avatar variant="connector" size="large">
        <Icon name={icon} color="dark" size="large" />
      </Avatar>

      <div className="flex flex-col gap-1">
        {typeof title === 'string' ? (
          <Typography variant="headline" color="grey700">
            {title}
          </Typography>
        ) : (
          title
        )}
        <Typography variant="body" color="grey600">
          {description}
        </Typography>
      </div>
    </div>
  )
}

const DetailsPageOverviewLine: FC<{
  title: string
  value: string | JSX.Element
  className?: string
}> = ({ title, value, className }) => {
  return (
    <div className={tw('flex items-start gap-2', className)}>
      <Typography variant="caption" color="grey600" noWrap className="min-w-35">
        {title}
      </Typography>
      {typeof value === 'string' ? (
        <Typography variant="body" color="grey700">
          {value}
        </Typography>
      ) : (
        value
      )}
    </div>
  )
}

const DetailsPageOverview: FC<
  PropsWithChildren<{
    className?: string
    leftColumn: JSX.Element
    rightColumn: JSX.Element
    isLoading?: boolean
  }>
> = ({ className, leftColumn, rightColumn, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-row gap-8 py-6">
        <div className={tw('flex flex-1 flex-col gap-2', className)}>
          {[...Array(3)].map((_, index) => (
            <div key={`leftColumn-skeleton-${index}`} className="flex flex-row gap-8">
              <Skeleton variant="text" className="w-28" />
              <Skeleton variant="text" className="w-50" />
            </div>
          ))}
        </div>
        <div className={tw('flex flex-1 flex-col gap-2', className)}>
          {[...Array(2)].map((_, index) => (
            <div key={`rightColumn-skeleton-${index}`} className="flex flex-row gap-8">
              <Skeleton variant="text" className="w-28" />
              <Skeleton variant="text" className="w-50" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className={tw('flex flex-row gap-8 py-6', className)}>
      <div className={tw('flex flex-1 flex-col gap-2', className)}>{leftColumn}</div>
      <div className={tw('flex flex-1 flex-col gap-2', className)}>{rightColumn}</div>
    </div>
  )
}

export const DetailsPage = {
  Container: DetailsPageContainer,
  Header: DetailsPageHeader,
  Overview: DetailsPageOverview,
  OverviewLine: DetailsPageOverviewLine,
}
