import { memo } from 'react'
import styled, { css } from 'styled-components'
import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useNavigate, generatePath } from 'react-router-dom'

import { theme, NAV_HEIGHT } from '~/styles'
import { Avatar, Typography, Skeleton, Status, StatusEnum } from '~/components/designSystem'
import { CustomerItemFragment, StatusTypeEnum } from '~/generated/graphql'
import { CUSTOMER_DETAILS } from '~/core/router'
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
        type: StatusEnum.paused,
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
    <Item id={rowId} tabIndex={0} onClick={() => navigate(generatePath(CUSTOMER_DETAILS, { id }))}>
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
    <Item $isSkeleton>
      <Skeleton variant="connectorAvatar" size="medium" />
      <Skeleton variant="text" height={12} width={240} />
      <Skeleton variant="text" height={12} width={240} />
    </Item>
  )
}

const Item = styled.div<{ $isSkeleton?: boolean }>`
  width: 100%;
  box-sizing: border-box;
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  cursor: pointer;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }

  ${({ $isSkeleton }) =>
    !$isSkeleton
      ? css`
          cursor: pointer;
          &:hover:not(:active),
          &:focus:not(:active) {
            background-color: ${theme.palette.grey[100]};
            outline: none;
          }

          &:active {
            background-color: ${theme.palette.grey[200]};
            outline: none;
          }
        `
      : css`
          > *:first-child {
            margin-right: ${theme.spacing(3)};
          }
          > *:last-child  {
            margin-left: auto;
          }
        `}

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
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
