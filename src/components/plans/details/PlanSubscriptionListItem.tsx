import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { generatePath } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { computeCustomerInitials } from '~/components/customers/utils'
import { Avatar, Skeleton, Typography } from '~/components/designSystem'
import { PLAN_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import { PlanSubscriptionListItemForSubscriptionListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/pages/SubscriptionDetails'
import { ListItemLink, NAV_HEIGHT, theme } from '~/styles'

gql`
  fragment PlanSubscriptionListItemForSubscriptionList on Subscription {
    id
    endingAt
    subscriptionAt
    plan {
      id
      parent {
        id
      }
    }
    customer {
      id
      name
      displayName
      firstname
      lastname
      externalId
    }
  }
`

interface PlanSubscriptionListItemProps {
  subscriptionItem?: PlanSubscriptionListItemForSubscriptionListFragment
  className?: string
}

export const PlanSubscriptionListItem = ({
  subscriptionItem,
  className,
  ...props
}: PlanSubscriptionListItemProps) => {
  const { translate } = useInternationalization()

  const customerName = subscriptionItem?.customer?.displayName
  const customerInitials = computeCustomerInitials(subscriptionItem?.customer)

  return (
    <ItemLink
      to={generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
        planId: subscriptionItem?.plan.id as string,
        subscriptionId: subscriptionItem?.id as string,
        tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
      })}
      className={className}
      {...props}
    >
      <GridItem>
        <CustomerNameWrapper>
          <Avatar
            size="big"
            variant="user"
            identifier={customerName as string}
            initials={customerInitials}
          />
          <CustomerBlockInfos>
            <Typography variant="bodyHl" color="grey700" noWrap>
              {customerName}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {subscriptionItem?.customer.externalId}
            </Typography>
          </CustomerBlockInfos>
        </CustomerNameWrapper>
        <Typography variant="body" color="grey700">
          {!!subscriptionItem?.plan?.parent?.id
            ? translate('text_65281f686a80b400c8e2f6dd')
            : translate('text_65281f686a80b400c8e2f6d1')}
        </Typography>
        <Typography variant="body" color="grey700">
          {DateTime.fromISO(subscriptionItem?.subscriptionAt).toFormat('LLL. dd, yyyy')}
        </Typography>
        <Typography variant="body" color="grey700">
          {!!subscriptionItem?.endingAt
            ? DateTime.fromISO(subscriptionItem?.endingAt).toFormat('LLL. dd, yyyy')
            : '-'}
        </Typography>
      </GridItem>
    </ItemLink>
  )
}

PlanSubscriptionListItem.displayName = 'PlanSubscriptionListItem'

interface PlanSubscriptionListItemSkeletonProps {
  className?: string
}

export const PlanSubscriptionListItemSkeleton = ({
  className,
}: PlanSubscriptionListItemSkeletonProps) => {
  return (
    <SkeletonWrapper className={className}>
      <CustomerNameWrapper>
        <Skeleton variant="circular" size="big" />
        <CustomerBlockInfos>
          <Skeleton variant="text" className="mb-3 w-40" />
          <Skeleton variant="text" className="w-25" />
        </CustomerBlockInfos>
      </CustomerNameWrapper>
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="text" className="w-20" />
    </SkeletonWrapper>
  )
}

export const PlanSubscriptionListItemGridTemplate = () => css`
  display: grid;
  grid-template-columns: 1fr 112px 112px 112px;
  gap: ${theme.spacing(4)};
`

const Grid = () => css`
  position: relative;
  align-items: center;
  width: 100%;
  ${PlanSubscriptionListItemGridTemplate()}
`

const GridItem = styled.div`
  ${Grid()}
`

const Item = () => css`
  width: 100%;
  box-sizing: border-box;
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(4)};
`

const ItemLink = styled(ListItemLink)`
  ${Item()}

  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  &:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    box-shadow: none;
  }
`

const SkeletonWrapper = styled.div`
  ${Item()}
  ${Grid()}
`

const CustomerNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const CustomerBlockInfos = styled.div`
  width: 100%;
`
