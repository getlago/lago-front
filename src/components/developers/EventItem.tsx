import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'

import { Avatar, Icon, Skeleton, Typography } from '~/components/designSystem'
import { formatDateToTZ } from '~/core/timezone'
import { EventItemFragment, TimezoneEnum } from '~/generated/graphql'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { BaseListItem, ItemContainer, ListItem, theme } from '~/styles'
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
      <Item tabIndex={0} onClick={onClick} {...navigationProps} $active={selected}>
        <NameSection>
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
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {code}
            </Typography>
          </NameBlock>
        </NameSection>
        <Typography>{formatDateToTZ(receivedAt, TimezoneEnum.TzUtc, 'HH:mm:ss')}</Typography>
      </Item>
    </ItemContainer>
  )
}

export const EventItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="text" height={12} width={68} marginRight="12px" />
      <Skeleton variant="text" height={12} width={264} marginRight="auto" />
      <Skeleton variant="text" height={12} width={80} />
    </SkeletonItem>
  )
}

const SkeletonItem = styled(BaseListItem)`
  > *:last-child {
    margin-left: ${theme.spacing(3)};
  }
`

const NameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const NameBlock = styled.div`
  min-width: 0;
`

const Item = styled(ListItem)<{ $active: boolean }>`
  ${({ $active }) =>
    $active &&
    css`
      background-color: ${theme.palette.grey[200]};
    `}
`
