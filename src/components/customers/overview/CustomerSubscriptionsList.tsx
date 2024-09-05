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
import { usePermissions } from '~/hooks/usePermissions'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { SubscriptionItem, SubscriptionItemSkeleton } from '../subscriptions/SubscriptionItem'
import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '../subscriptions/TerminateCustomerSubscriptionDialog'

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
  const { hasPermissions } = usePermissions()
  const { data, loading } = useGetCustomerSubscriptionForListQuery({
    variables: { id: customerId as string },
    skip: !customerId,
  })
  const subscriptions = data?.customer?.subscriptions
  const hasNoSubscription = !subscriptions || !subscriptions.length
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)

  return (
    <SideSection data-test="customer-subscriptions-list">
      <Header variant="subhead" $hideBottomShadow>
        {translate('text_6250304370f0f700a8fdc28d')}

        {hasPermissions(['subscriptionsCreate']) && (
          <Button
            data-test="add-subscription"
            variant="quaternary"
            onClick={() =>
              navigate(
                generatePath(CREATE_SUBSCRIPTION, {
                  customerId: customerId as string,
                }),
              )
            }
          >
            {translate('text_6250304370f0f700a8fdc28b')}
          </Button>
        )}
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
            <Typography variant="bodyHl" color="disabled" noWrap>
              {translate('text_6253f11816f710014600b9ed')}
            </Typography>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_62d7f6178ec94cd09370e5fb')}
            </Typography>
            <Typography variant="bodyHl" color="disabled">
              {translate('text_6253f11816f710014600b9f1')}
            </Typography>
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
  display: grid;
  align-items: center;
  padding: 0 ${theme.spacing(4)};
  grid-template-columns: 1fr 80px 120px 40px;
  grid-column-gap: ${theme.spacing(4)};
`

const List = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const LoadingContent = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`
