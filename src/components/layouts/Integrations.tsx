import { FC, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

import { Avatar, Chip, Icon, IconName, Skeleton, Typography } from '~/components/designSystem'
import { tw } from '~/styles/utils'

const IntegrationsContainer: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={tw('container flex max-w-168 flex-col gap-8', className)}>{children}</div>
}

const IntegrationsHeadline: FC<PropsWithChildren<{ label: string }>> = ({ label, children }) => {
  return (
    <div className={tw('flex h-18 w-full flex-row items-center justify-between')}>
      <Typography variant="subhead">{label}</Typography>
      {children}
    </div>
  )
}

const IntegrationsHeader: FC<{
  isLoading?: boolean
  integrationLogo: React.ReactNode
  integrationName: string
  integrationChip?: string
  integrationDescription: string
}> = ({ isLoading, integrationLogo, integrationName, integrationDescription, integrationChip }) => {
  return (
    <div className="flex items-center px-4 py-8 md:px-12">
      {isLoading ? (
        <>
          <Skeleton variant="connectorAvatar" size="large" className="mr-4" />
          <div>
            <Skeleton variant="text" className="mb-1 w-50" />
            <Skeleton variant="text" className="w-32" />
          </div>
        </>
      ) : (
        <>
          <Avatar className="mr-4" variant="connector-full" size="large">
            {integrationLogo}
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Typography variant="headline">{integrationName}</Typography>
              {integrationChip && <Chip label={integrationChip} />}
            </div>
            <Typography>{integrationDescription}</Typography>
          </div>
        </>
      )}
    </div>
  )
}

const IntegrationListItem: FC<
  PropsWithChildren<{ to: string; label: string; subLabel: string }>
> = ({ to, label, subLabel, children }) => {
  return (
    <div className="relative">
      <Link
        tabIndex={0}
        to={to}
        className="box-border flex min-h-18 w-full items-center shadow-b visited:text-inherit hover:bg-grey-100 hover:no-underline focus:bg-grey-100 focus:ring-0 active:bg-grey-200"
      >
        <div className="flex flex-row items-center gap-3">
          <Avatar variant="connector" size="big">
            <Icon name="plug" color="dark" />
          </Avatar>
          <div>
            <Typography variant="body" color="grey700">
              {label}
            </Typography>
            <Typography variant="caption" color="grey600">
              {subLabel}
            </Typography>
          </div>
          <div className="size-10" />
        </div>
      </Link>
      {children}
    </div>
  )
}

const IntegrationDetailsItem: FC<
  PropsWithChildren<{
    icon: IconName
    label: string
    value?: string
  }>
> = ({ icon, label, value, children }) => {
  return (
    <div className={'flex min-h-18 flex-row items-center justify-between py-2 shadow-b'}>
      <div className="flex flex-1 items-center gap-3">
        <Avatar variant="connector" size="big">
          <Icon name={icon} color="dark" />
        </Avatar>
        <div>
          <Typography variant="caption" color="grey600">
            {label}
          </Typography>
          <Typography variant="body" color="grey700">
            {value}
          </Typography>
        </div>
      </div>
      {children}
    </div>
  )
}
const IntegrationItemSkeleton: FC = () => {
  return (
    <div className="flex h-18 items-center shadow-b">
      <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
      <Skeleton variant="text" className="w-60" />
    </div>
  )
}

export const IntegrationsPage = {
  Header: IntegrationsHeader,
  Container: IntegrationsContainer,
  Headline: IntegrationsHeadline,
  ItemSkeleton: IntegrationItemSkeleton,
  ListItem: IntegrationListItem,
  DetailsItem: IntegrationDetailsItem,
}
