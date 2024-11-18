import { gql } from '@apollo/client'
import { RefObject } from 'react'
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
    subscriptionAt
    endingAt
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
  terminateSubscriptionDialogRef: RefObject<TerminateCustomerSubscriptionDialogRef> | null
}

export const SubscriptionItem = ({
  subscription,
  customerTimezone,
  terminateSubscriptionDialogRef,
}: SubscriptionItemProps) => {
  const { translate } = useInternationalization()
  const {
    id,
    plan,
    status,
    nextPlan,
    nextPendingStartDate,
    externalId,
    nextName,
    name,
    startedAt,
    subscriptionAt,
    endingAt,
  } = subscription || {}
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const isDowngrading = !!nextPlan
  const isPending = status === StatusTypeEnum.Pending
  const hasEndingAtForActive = status === StatusTypeEnum.Active && !!endingAt

  if (!subscription) return null

  return (
    <SubscriptionContainer key={id}>
      {isDowngrading && (
        <SubscriptionLine
          terminateSubscriptionDialogRef={terminateSubscriptionDialogRef}
          subscriptionId={subscription.nextSubscription?.id as string}
          subscriptionExternalId={externalId}
          subscriptionName={nextName}
          date={nextPendingStartDate}
          plan={nextPlan}
          hasBottomSection={isDowngrading || isPending || hasEndingAtForActive}
          status={StatusTypeEnum.Pending}
          isDowngrade
          customerTimezone={customerTimezone}
        />
      )}
      <SubscriptionLine
        terminateSubscriptionDialogRef={terminateSubscriptionDialogRef}
        subscriptionId={id}
        subscriptionExternalId={externalId}
        subscriptionName={name}
        date={startedAt || subscriptionAt}
        hasAboveSection={isDowngrading}
        hasBottomSection={isDowngrading || isPending || hasEndingAtForActive}
        plan={plan}
        status={status}
        customerTimezone={customerTimezone}
      />
      {isDowngrading ? (
        <DateInfos variant="caption">
          {translate('text_62681c60582e4f00aa82938a', {
            planName: nextPlan?.name,
            dateStartNewPlan: !nextPendingStartDate ? '-' : formatTimeOrgaTZ(nextPendingStartDate),
          })}
        </DateInfos>
      ) : isPending ? (
        <DateInfos variant="caption">
          {translate('text_6335e50b0b089e1d8ed50960', {
            planName: plan?.name,
            startDate: formatTimeOrgaTZ(subscriptionAt),
          })}
        </DateInfos>
      ) : hasEndingAtForActive ? (
        <DateInfos variant="caption">
          {translate('text_64ef55a730b88e3d2117b44e', {
            planName: plan?.name,
            date: formatTimeOrgaTZ(endingAt),
          })}
        </DateInfos>
      ) : null}
    </SubscriptionContainer>
  )
}

SubscriptionItem.displayName = 'SubscriptionItem'

export const SubscriptionItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Skeleton variant="connectorAvatar" size="big" className="mr-3" />
      <div>
        <Skeleton variant="text" width={240} className="mb-3" />
        <Skeleton variant="text" width={120} />
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
