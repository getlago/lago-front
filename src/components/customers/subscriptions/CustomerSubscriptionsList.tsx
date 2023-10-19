import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { CREATE_SUBSCRIPTION } from '~/core/router'
import {
  SubscriptionItemFragmentDoc,
  TimezoneEnum,
  useGetCustomerSubscriptionForListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { SubscriptionItem, SubscriptionItemSkeleton } from './SubscriptionItem'
import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from './TerminateCustomerSubscriptionDialog'

gql`
  query getCustomerSubscriptionForList($id: ID!) {
    customer(id: $id) {
      id
      subscriptions(status: [active, pending]) {
        id
        plan {
          id
          amountCurrency
        }
        ...SubscriptionItem
      }
    }
  }

  ${SubscriptionItemFragmentDoc}
`

interface CustomerSubscriptionsListProps {
  customerTimezone?: TimezoneEnum
}

export const CustomerSubscriptionsList = ({ customerTimezone }: CustomerSubscriptionsListProps) => {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { data, loading } = useGetCustomerSubscriptionForListQuery({
    variables: { id: customerId as string },
    skip: !customerId,
  })
  const subscriptions = data?.customer?.subscriptions
  const hasNoSubscription = !subscriptions || !subscriptions.length
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)

  return (
    <SideSection $empty={hasNoSubscription}>
      <Header variant="subhead" $loading={loading}>
        {translate('text_6250304370f0f700a8fdc28d')}
        <Button
          data-test="add-subscription"
          variant="quaternary"
          onClick={() =>
            navigate(
              generatePath(CREATE_SUBSCRIPTION, {
                customerId: customerId as string,
              })
            )
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
                  terminateSubscriptionDialogRef={terminateSubscriptionDialogRef}
                  key={`${subscription?.id}-${i}`}
                  subscription={subscription}
                  customerTimezone={customerTimezone}
                />
              )
            })}
          </List>
        </>
      )}
      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </SideSection>
  )
}

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
