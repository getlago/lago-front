import { forwardRef, MutableRefObject, useRef } from 'react'
import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { DateTime } from 'luxon'

import {
  CustomerSubscriptionListFragment,
  SubscriptionItemPlanFragmentDoc,
} from '~/generated/graphql'
import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, HEADER_TABLE_HEIGHT } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { SubscriptionItem, SubscriptionItemSkeleton, SubscriptionItemRef } from './SubscriptionItem'
import { AddSubscriptionToCustomerDrawerRef } from './AddSubscriptionToCustomerDrawer'
import {
  EditCustomerSubscriptionDialog,
  EditCustomerSubscriptionDialogRef,
} from './EditCustomerSubscriptionDialog'
import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from './TerminateCustomerSubscriptionDialog'

gql`
  fragment CustomerSubscriptionList on Subscription {
    id
    status
    startedAt
    nextPendingStartDate
    name
    nextName
    externalId
    periodEndDate
    plan {
      ...SubscriptionItemPlan
    }
    nextPlan {
      ...SubscriptionItemPlan
    }
  }

  ${SubscriptionItemPlanFragmentDoc}
`

interface CustomerSubscriptionsListProps {
  subscriptions?: CustomerSubscriptionListFragment[]
  loading?: boolean
}

export const CustomerSubscriptionsList = forwardRef<
  AddSubscriptionToCustomerDrawerRef,
  CustomerSubscriptionsListProps
>(({ subscriptions, loading }: CustomerSubscriptionsListProps, addSubscriptionDialogRef) => {
  const { translate } = useInternationalization()
  const hasNoSubscription = !subscriptions || !subscriptions.length
  const editSubscriptionDialogRef = useRef<EditCustomerSubscriptionDialogRef>(null)
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)
  const subscriptionItemRef = useRef<SubscriptionItemRef>({
    addSubscriptionDialogRef,
    editSubscriptionDialogRef,
    terminateSubscriptionDialogRef,
  })

  return (
    <SideSection $empty={hasNoSubscription}>
      <Header variant="subhead" $loading={loading}>
        {translate('text_6250304370f0f700a8fdc28d')}
        <Button
          variant="quaternary"
          onClick={() =>
            (
              addSubscriptionDialogRef as MutableRefObject<AddSubscriptionToCustomerDrawerRef>
            )?.current?.openDrawer({
              hasNoSubscription: !subscriptions || subscriptions.length < 1,
            })
          }
        >
          {translate('text_6250304370f0f700a8fdc28b')}
        </Button>
      </Header>
      {loading ? (
        <LoadingContent>
          {[0, 1, 2].map((skeleton, i) => (
            <SubscriptionItemSkeleton key={`customer-subscription-skeleton-${i}`} />
          ))}
        </LoadingContent>
      ) : hasNoSubscription ? (
        <Typography>{translate('text_6250304370f0f700a8fdc28f')}</Typography>
      ) : (
        <>
          <ListHeader>
            <CellBigHeader variant="bodyHl" color="disabled" noWrap>
              {translate('text_6253f11816f710014600b9ed')}
            </CellBigHeader>
            <CellStatusHeader variant="bodyHl" color="disabled">
              {translate('text_62d7f6178ec94cd09370e5fb')}
            </CellStatusHeader>
            <CellSmall variant="bodyHl" color="disabled" align="right">
              {translate('text_6253f11816f710014600b9f1')}
            </CellSmall>
          </ListHeader>
          <List>
            {subscriptions.map((subscription) => {
              const {
                id,
                externalId,
                name,
                plan,
                startedAt,
                nextName,
                nextPendingStartDate,
                nextPlan,
                periodEndDate,
              } = subscription
              const isDowngrading = !!nextPlan

              return (
                <SubscriptionContainer key={id}>
                  {isDowngrading && !!nextPlan && (
                    <SubscriptionItem
                      ref={subscriptionItemRef}
                      subscriptionId={id}
                      subscriptionExternalId={externalId}
                      subscriptionName={nextName}
                      endDate={periodEndDate}
                      date={nextPendingStartDate}
                      plan={nextPlan}
                      isPending
                    />
                  )}
                  <SubscriptionItem
                    ref={subscriptionItemRef}
                    subscriptionId={id}
                    subscriptionExternalId={externalId}
                    subscriptionName={name}
                    endDate={periodEndDate}
                    date={startedAt}
                    plan={plan}
                  />
                  {isDowngrading && !!nextPlan && (
                    <DowngradeInfo variant="caption">
                      {translate('text_62681c60582e4f00aa82938a', {
                        planName: nextPlan?.name,
                        dateStartNewPlan: !nextPendingStartDate
                          ? '-'
                          : DateTime.fromISO(nextPendingStartDate).toFormat('LLL. dd, yyyy'),
                      })}
                    </DowngradeInfo>
                  )}
                </SubscriptionContainer>
              )
            })}
          </List>
        </>
      )}
      <EditCustomerSubscriptionDialog ref={editSubscriptionDialogRef} />
      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </SideSection>
  )
})

CustomerSubscriptionsList.displayName = 'CustomerSubscriptionsList'

const Header = styled(SectionHeader)<{ $loading?: boolean }>`
  ${({ $loading }) =>
    $loading &&
    css`
      box-shadow: none;
    `}
`

const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(18)} 0 ${theme.spacing(4)};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const List = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const SubscriptionContainer = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;

  > *:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const CellBigHeader = styled(Typography)`
  flex: 1;
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const CellStatusHeader = styled(Typography)`
  width: 88px;
`

const DowngradeInfo = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 0 ${theme.spacing(4)};
`

const LoadingContent = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`
