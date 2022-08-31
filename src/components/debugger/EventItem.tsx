import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { DateTime } from 'luxon'

import { EventItemFragment } from '~/generated/graphql'
import { theme, BaseListItem, ListItem, ItemContainer } from '~/styles'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { Skeleton, Icon, Typography, Avatar } from '~/components/designSystem'

gql`
  fragment EventItem on Event {
    id
    code
    externalCustomerId
    timestamp
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
  const { code, externalCustomerId, timestamp, matchBillableMetric, matchCustomField } = event
  const hasWarning = !matchBillableMetric || !matchCustomField

  return (
    <ItemContainer>
      <Item tabIndex={0} onClick={onClick} {...navigationProps} $active={selected}>
        <NameSection>
          <ListAvatar variant="connector" $hasWarning={hasWarning}>
            <Icon
              name={hasWarning ? 'warning-unfilled' : 'checkmark'}
              color={hasWarning ? 'warning' : 'dark'}
            />
          </ListAvatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {code}
            </Typography>
            <Typography variant="caption" noWrap>
              {externalCustomerId}
            </Typography>
          </NameBlock>
        </NameSection>
        <Typography>{DateTime.fromISO(timestamp).toFormat('HH:mm:ss')}</Typography>
      </Item>
    </ItemContainer>
  )
}

export const EventItemSkeleton = () => {
  return (
    <SkeletonItem>
      <div>
        <Skeleton variant="text" height={12} width={68} marginRight="12px" />
        <Skeleton variant="text" height={12} width={264} marginRight="auto" />
      </div>
      <Skeleton variant="text" height={12} width={80} />
    </SkeletonItem>
  )
}

const SkeletonItem = styled(BaseListItem)`
  > *:first-child {
    min-width: 0;
    display: flex;
    margin-right: auto;
  }
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

const ListAvatar = styled(Avatar)<{ $hasWarning?: boolean }>`
  margin-right: ${theme.spacing(3)};
  ${({ $hasWarning }) =>
    $hasWarning &&
    css`
      background-color: ${theme.palette.secondary[100]};
    `}
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
