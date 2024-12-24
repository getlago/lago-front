import { gql } from '@apollo/client'
import { PropsWithChildren, RefObject } from 'react'

import { Skeleton, Typography } from '~/components/designSystem'
import {
  StatusTypeEnum,
  SubscriptionItemFragment,
  SubscriptionLinePlanFragmentDoc,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

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

const DateInfos = ({ children }: PropsWithChildren) => (
  <Typography variant="caption" className="flex h-12 items-center justify-end px-4">
    {children}
  </Typography>
)

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
    <div
      className="rounded-xl border border-solid border-grey-400 not-last-child:shadow-b"
      key={id}
    >
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
        <DateInfos>
          {translate('text_62681c60582e4f00aa82938a', {
            planName: nextPlan?.name,
            dateStartNewPlan: !nextPendingStartDate ? '-' : formatTimeOrgaTZ(nextPendingStartDate),
          })}
        </DateInfos>
      ) : isPending ? (
        <DateInfos>
          {translate('text_6335e50b0b089e1d8ed50960', {
            planName: plan?.name,
            startDate: formatTimeOrgaTZ(subscriptionAt),
          })}
        </DateInfos>
      ) : hasEndingAtForActive ? (
        <DateInfos>
          {translate('text_64ef55a730b88e3d2117b44e', {
            planName: plan?.name,
            date: formatTimeOrgaTZ(endingAt),
          })}
        </DateInfos>
      ) : null}
    </div>
  )
}

SubscriptionItem.displayName = 'SubscriptionItem'

export const SubscriptionItemSkeleton = () => {
  return (
    <div className="flex h-18 items-center rounded-xl border border-solid border-grey-400 px-4">
      <Skeleton variant="connectorAvatar" size="big" className="mr-3" />
      <div>
        <Skeleton variant="text" className="mb-3 w-60" />
        <Skeleton variant="text" className="w-30" />
      </div>
    </div>
  )
}
