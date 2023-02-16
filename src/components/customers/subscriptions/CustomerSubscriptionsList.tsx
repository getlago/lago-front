import { forwardRef, MutableRefObject, useRef } from 'react'
import styled, { css } from 'styled-components'

import { SubscriptionItemFragment, TimezoneEnum } from '~/generated/graphql'
import { Typography, Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, HEADER_TABLE_HEIGHT } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { SubscriptionItem, SubscriptionItemSkeleton, SubscriptionItemRef } from './SubscriptionItem'
import { AddSubscriptionDrawerRef } from './AddSubscriptionDrawer'
import {
  EditCustomerSubscriptionDrawer,
  EditCustomerSubscriptionDrawerRef,
} from './EditCustomerSubscriptionDrawer'
import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from './TerminateCustomerSubscriptionDialog'

interface CustomerSubscriptionsListProps {
  subscriptions?: SubscriptionItemFragment[]
  customerTimezone: TimezoneEnum
  loading?: boolean
}

export const CustomerSubscriptionsList = forwardRef<
  AddSubscriptionDrawerRef,
  CustomerSubscriptionsListProps
>(
  (
    { subscriptions, loading, customerTimezone }: CustomerSubscriptionsListProps,
    addSubscriptionDialogRef
  ) => {
    const { translate } = useInternationalization()
    const hasNoSubscription = !subscriptions || !subscriptions.length
    const editSubscriptionDrawerRef = useRef<EditCustomerSubscriptionDrawerRef>(null)
    const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)
    const subscriptionItemRef = useRef<SubscriptionItemRef>({
      addSubscriptionDialogRef,
      editSubscriptionDrawerRef,
      terminateSubscriptionDialogRef,
    })

    return (
      <SideSection $empty={hasNoSubscription}>
        <Header variant="subhead" $loading={loading}>
          {translate('text_6250304370f0f700a8fdc28d')}
          <Button
            data-test="add-subscription"
            variant="quaternary"
            onClick={() =>
              (
                addSubscriptionDialogRef as MutableRefObject<AddSubscriptionDrawerRef>
              )?.current?.openDialog()
            }
          >
            {translate('text_6250304370f0f700a8fdc28b')}
          </Button>
        </Header>
        {loading ? (
          <LoadingContent>
            {[0, 1, 2].map((_, i) => (
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
              {subscriptions.map((subscription, i) => {
                return (
                  <SubscriptionItem
                    ref={subscriptionItemRef}
                    key={`${subscription?.id}-${i}`}
                    subscription={subscription}
                    customerTimezone={customerTimezone}
                  />
                )
              })}
            </List>
          </>
        )}
        <EditCustomerSubscriptionDrawer ref={editSubscriptionDrawerRef} />
        <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
      </SideSection>
    )
  }
)

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

const CellBigHeader = styled(Typography)`
  flex: 1;
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const CellStatusHeader = styled(Typography)`
  width: 88px;
`

const LoadingContent = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`
