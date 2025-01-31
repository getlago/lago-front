import { FC } from 'react'

import { Avatar, Chip, Skeleton, Typography } from '~/components/designSystem'

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

export const IntegrationsPage = {
  Header: IntegrationsHeader,
}
