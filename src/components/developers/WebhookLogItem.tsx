import { gql } from '@apollo/client'

import { Avatar, Icon, Skeleton, Typography } from '~/components/designSystem'
import { WebhookLogItemFragment, WebhookStatusEnum } from '~/generated/graphql'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { BaseListItem, ItemContainer, ListItem } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  fragment WebhookLogItem on Webhook {
    id
    status
    updatedAt
    webhookType
  }
`

interface WebhookLogItemProps {
  log: WebhookLogItemFragment
  navigationProps?: ListKeyNavigationItemProps
  selected: boolean
  onClick: () => void
  className?: string
}

export const WebhookLogItem = ({
  className,
  log,
  navigationProps,
  selected,
  onClick,
}: WebhookLogItemProps) => {
  const { id, status, webhookType, updatedAt } = log
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const hasError = status === WebhookStatusEnum.Failed

  return (
    <ItemContainer>
      <ListItem
        className={tw({ 'bg-grey-200': selected }, className)}
        tabIndex={0}
        onClick={onClick}
        {...navigationProps}
      >
        <div className="mr-auto flex min-w-0 items-center">
          <Avatar size="big" variant="connector" className={tw('mr-3', { 'bg-red-100': hasError })}>
            <Icon
              name={hasError ? 'close-circle-unfilled' : 'checkmark'}
              color={hasError ? 'error' : 'dark'}
            />
          </Avatar>
          <div className="min-w-0">
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {webhookType}
            </Typography>
            <Typography variant="caption" noWrap>
              {id}
            </Typography>
          </div>
        </div>
        <Typography>{formatTimeOrgaTZ(updatedAt, 'HH:mm:ss')}</Typography>
      </ListItem>
    </ItemContainer>
  )
}

export const WebhookLogItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton className="mr-3" variant="connectorAvatar" size="big" />
      <Skeleton className="mr-auto" variant="text" height={12} width={264} />
      <Skeleton className="ml-3" variant="text" height={12} width={80} />
    </BaseListItem>
  )
}
