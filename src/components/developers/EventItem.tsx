import { gql } from '@apollo/client'

import { Avatar, Icon, Skeleton, Typography } from '~/components/designSystem'
import { formatDateToTZ } from '~/core/timezone'
import { EventItemFragment, TimezoneEnum } from '~/generated/graphql'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { BaseListItem, ItemContainer, ListItem } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  fragment EventItem on Event {
    id
    code
    receivedAt
    matchBillableMetric
    matchCustomField
  }
`
interface EventItemProps {
  event: EventItemFragment
  navigationProps?: ListKeyNavigationItemProps
  selected: boolean
  onClick: () => void
}

export const EventItem = ({ event, navigationProps, selected, onClick }: EventItemProps) => {
  const { code, receivedAt, matchBillableMetric, matchCustomField } = event
  const hasWarning = !matchBillableMetric || !matchCustomField

  return (
    <ItemContainer>
      <ListItem
        className={tw({ 'bg-grey-200': selected })}
        tabIndex={0}
        onClick={onClick}
        {...navigationProps}
      >
        <div className="mr-auto flex min-w-0 items-center">
          <Avatar
            className={tw('mr-3', {
              'bg-yellow-100': hasWarning,
            })}
            variant="connector"
          >
            <Icon
              name={hasWarning ? 'warning-unfilled' : 'checkmark'}
              color={hasWarning ? 'warning' : 'dark'}
            />
          </Avatar>
          <Typography className="mr-1 min-w-0" color="textSecondary" variant="bodyHl" noWrap>
            {code}
          </Typography>
        </div>
        <Typography>{formatDateToTZ(receivedAt, TimezoneEnum.TzUtc, 'HH:mm:ss')}</Typography>
      </ListItem>
    </ItemContainer>
  )
}

export const EventItemSkeleton = () => {
  return (
    <BaseListItem>
      <Skeleton className="mr-3" variant="connectorAvatar" size="big" />
      <Skeleton className="mr-auto w-66" variant="text" />
      <Skeleton className="ml-3 w-20" variant="text" />
    </BaseListItem>
  )
}
