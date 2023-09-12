import { gql } from '@apollo/client'
import { ForwardedRef, forwardRef } from 'react'
import styled from 'styled-components'

import { Skeleton, Typography } from '~/components/designSystem'
import {
  StatusTypeEnum,
  SubscriptionItemFragment,
  SubscriptionLinePlanFragmentDoc,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { HEADER_TABLE_HEIGHT, NAV_HEIGHT, theme } from '~/styles'

import { AddSubscriptionDrawerRef } from './AddSubscriptionDrawer'
import { EditCustomerSubscriptionDrawerRef } from './EditCustomerSubscriptionDrawer'
import { SubscriptionLine } from './SubscriptionLine'
import { TerminateCustomerSubscriptionDialogRef } from './TerminateCustomerSubscriptionDialog'

gql`
  fragment SubscriptionItem on Subscription {
    id
    status
    startedAt
    nextPendingStartDate
    name
    nextName
    externalId
    periodEndDate
    subscriptionAt
    plan {
      ...SubscriptionLinePlan
    }
    nextPlan {
      ...SubscriptionLinePlan
    }
    nextSubscription {
      id
    }
  }

  ${SubscriptionLinePlanFragmentDoc}
`

interface SubscriptionItemProps {
  subscription: SubscriptionItemFragment
  customerTimezone?: TimezoneEnum
}

export interface SubscriptionItemRef {
  addSubscriptionDialogRef: ForwardedRef<AddSubscriptionDrawerRef> | null
  editSubscriptionDrawerRef: ForwardedRef<EditCustomerSubscriptionDrawerRef> | null
  terminateSubscriptionDialogRef: ForwardedRef<TerminateCustomerSubscriptionDialogRef> | null
}

export const SubscriptionItem = forwardRef<SubscriptionItemRef, SubscriptionItemProps>(
  ({ subscription, customerTimezone }: SubscriptionItemProps, ref) => {
    const { translate } = useInternationalization()
    const {
      id,
      plan,
      periodEndDate,
      status,
      nextPlan,
      nextPendingStartDate,
      externalId,
      nextName,
      name,
      startedAt,
      subscriptionAt,
    } = subscription || {}
    const { formatTimeOrgaTZ } = useOrganizationInfos()
    const isDowngrading = !!nextPlan

    if (!subscription) return null

    return (
      <SubscriptionContainer key={id}>
        {isDowngrading && !!nextPlan && (
          <SubscriptionLine
            ref={ref}
            subscriptionId={subscription.nextSubscription?.id as string}
            subscriptionExternalId={externalId}
            subscriptionName={nextName}
            date={nextPendingStartDate}
            plan={nextPlan}
            periodEndDate={periodEndDate}
            status={StatusTypeEnum.Pending}
            isDowngrade
            customerTimezone={customerTimezone}
          />
        )}
        <SubscriptionLine
          ref={ref}
          subscriptionId={id}
          subscriptionExternalId={externalId}
          subscriptionName={name}
          date={startedAt || subscriptionAt}
          periodEndDate={periodEndDate}
          plan={plan}
          status={status}
          customerTimezone={customerTimezone}
        />
        {isDowngrading && !!nextPlan && (
          <DateInfos variant="caption">
            {translate('text_62681c60582e4f00aa82938a', {
              planName: nextPlan?.name,
              dateStartNewPlan: !nextPendingStartDate
                ? '-'
                : formatTimeOrgaTZ(nextPendingStartDate),
            })}
          </DateInfos>
        )}
        {status === StatusTypeEnum.Pending && (
          <DateInfos variant="caption">
            {translate('text_6335e50b0b089e1d8ed50960', {
              planName: plan?.name,
              startDate: formatTimeOrgaTZ(subscriptionAt),
            })}
          </DateInfos>
        )}
      </SubscriptionContainer>
    )
  }
)

SubscriptionItem.displayName = 'SubscriptionItem'

export const SubscriptionItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="connectorAvatar" size="medium" marginRight="12px" />
      <div>
        <Skeleton variant="text" width={240} height={12} marginBottom="12px" />
        <Skeleton variant="text" width={120} height={12} />
      </div>
    </SkeletonItem>
  )
}

const SkeletonItem = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  height: ${NAV_HEIGHT}px;
  align-items: center;
  display: flex;
  padding: 0 ${theme.spacing(4)};
  border-radius: 12px;
`

const SubscriptionContainer = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;

  > *:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const DateInfos = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 0 ${theme.spacing(4)};
`
