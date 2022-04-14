import { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useNavigate, generatePath } from 'react-router-dom'

import { theme, BaseListItem, ListItem } from '~/styles'
import { Avatar, Typography, Skeleton, Status, StatusEnum } from '~/components/designSystem'
import { CustomerItemFragment, StatusTypeEnum } from '~/generated/graphql'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { useI18nContext } from '~/core/I18nContext'

gql`
  fragment CustomerItem on Customer {
    id
    name
    customerId
    createdAt
    subscriptions {
      id
      status
      plan {
        id
        name
      }
    }
  }
`

interface CustomerItemProps {
  customer: CustomerItemFragment
  rowId: string
}

const mapStatus = (type?: StatusTypeEnum | null) => {
  switch (type) {
    case StatusTypeEnum.Active:
      return {
        type: StatusEnum.running,
        label: 'text_624efab67eb2570101d1180e',
      }
    case StatusTypeEnum.Pending:
      return {
        type: StatusEnum.paused,
        label: 'text_624efab67eb2570101d117f6',
      }
    default:
      return {
        type: StatusEnum.error,
        label: 'text_624efab67eb2570101d11826',
      }
  }
}

export const CustomerItem = memo(({ rowId, customer }: CustomerItemProps) => {
  const { id, name, customerId, subscriptions, createdAt } = customer
  const subscription = !subscriptions || !subscriptions[0] ? null : subscriptions[0]
  const status = mapStatus(subscription?.status)
  const { translate } = useI18nContext()
  const navigate = useNavigate()

  return (
    <Item
      id={rowId}
      tabIndex={0}
      onClick={() => navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id }))}
    >
      <CustomerNameSection>
        <ListAvatar
          variant="user"
          identifier={name as string}
          initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
        />
        <NameBlock>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" noWrap>
            {customerId}
          </Typography>
        </NameBlock>
      </CustomerNameSection>
      <PlanInfosSection>
        <MediumCell align="left">
          {!subscription || !subscription?.plan.name ? '-' : subscription?.plan.name}
        </MediumCell>
        <SmallCell align="left">
          {!subscription ? '-' : <Status type={status.type} label={translate(status.label)} />}
        </SmallCell>
        <SmallCell align="right">{DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}</SmallCell>
      </PlanInfosSection>
    </Item>
  )
})

CustomerItem.displayName = 'CustomerItem'

export const CustomerItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="connectorAvatar" size="medium" />
      <Skeleton variant="text" height={12} width={240} />
      <Skeleton variant="text" height={12} width={240} />
    </SkeletonItem>
  )
}

const SkeletonItem = styled(BaseListItem)`
  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
  > *:not(:first-child):not(:last-child) {
    margin-right: auto;
  }
`

const Item = styled(ListItem)`
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const MediumCell = styled(Typography)`
  width: 200px;
`

const SmallCell = styled(Typography)<{ $alignLeft?: boolean }>`
  width: 112px;
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const CustomerNameSection = styled.div`
  min-width: 0;
  margin-right: auto;
  display: flex;
  align-items: center;
  flex: 1;
`

const NameBlock = styled.div`
  min-width: 0;
`

const PlanInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`
