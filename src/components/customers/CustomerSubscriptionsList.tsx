import { useRef, useMemo, useImperativeHandle, forwardRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'

import { CustomerSubscriptionListFragment, StatusTypeEnum } from '~/generated/graphql'
import { Typography, Button, Avatar, Icon, Status, StatusEnum } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'

import { AddPlanToCustomerDialog, AddPlanToCustomerDialogRef } from './AddPlanToCustomerDialog'

gql`
  fragment CustomerSubscriptionList on Subscription {
    id
    status
    startedAt
    plan {
      id
      name
      code
    }
  }
`

export interface CustomerSubscriptionsListRef {
  openAddPlanDialog: () => void
}
interface CustomerSubscriptionsListProps {
  customerName: string
  customerId: string
  subscriptions?: CustomerSubscriptionListFragment[]
  refetchCustomer: () => void
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
    case StatusTypeEnum.Terminated:
    default:
      return {
        type: StatusEnum.error,
        label: 'text_624efab67eb2570101d11826',
      }
  }
}

export const CustomerSubscriptionsList = forwardRef<
  CustomerSubscriptionsListRef,
  CustomerSubscriptionsListProps
>(
  (
    { customerId, customerName, subscriptions, refetchCustomer }: CustomerSubscriptionsListProps,
    ref
  ) => {
    const { translate } = useI18nContext()
    const addPlanToCustomerDialogRef = useRef<AddPlanToCustomerDialogRef>(null)
    const hasNoSubscription = !subscriptions || !subscriptions.length
    const selectedPlansId = useMemo(
      () =>
        (subscriptions || []).reduce<string[]>((acc, s) => {
          if (
            [StatusTypeEnum.Active, StatusTypeEnum.Pending].includes(s.status as StatusTypeEnum)
          ) {
            acc.push(s.plan?.id)
          }
          return acc
        }, []),
      [subscriptions]
    )
    const downgradingTo =
      !!subscriptions && !!subscriptions.length
        ? subscriptions.find((s) => s.status === StatusTypeEnum.Pending)
        : undefined

    useImperativeHandle(ref, () => ({
      openAddPlanDialog: () => {
        addPlanToCustomerDialogRef?.current?.openDialog()
      },
    }))

    return (
      <SideSection $empty={hasNoSubscription}>
        <SectionHeader variant="subhead">
          {translate('text_6250304370f0f700a8fdc28d')}
          <Button
            variant="secondary"
            onClick={() => addPlanToCustomerDialogRef?.current?.openDialog()}
          >
            {hasNoSubscription
              ? translate('text_6250304370f0f700a8fdc28b')
              : translate('text_6253f11816f710014600b9e9')}
          </Button>
        </SectionHeader>
        {hasNoSubscription ? (
          <Typography>{translate('text_6250304370f0f700a8fdc28f')}</Typography>
        ) : (
          <>
            <ListHeader>
              <CellBigHeader variant="bodyHl" color="disabled" noWrap>
                {translate('text_6253f11816f710014600b9ed')}
              </CellBigHeader>
              <CellSmall variant="bodyHl" color="disabled">
                {translate('text_6253f11816f710014600b9ef')}
              </CellSmall>
              <CellSmall variant="bodyHl" color="disabled" align="right">
                {translate('text_6253f11816f710014600b9f1')}
              </CellSmall>
            </ListHeader>
            {subscriptions.map(({ id, plan, status, startedAt }) => {
              const statusConfig = mapStatus(status)

              return (
                <Item key={id}>
                  <CellBig>
                    <Avatar variant="connector">
                      <Icon name="clock" color="dark" />
                    </Avatar>
                    <NameBlock>
                      <Typography color="textSecondary" variant="bodyHl" noWrap>
                        {plan.name}
                      </Typography>
                      <Typography variant="caption" noWrap>
                        {plan.code}
                      </Typography>
                    </NameBlock>
                  </CellBig>
                  <CellStatus type={statusConfig.type} label={translate(statusConfig.label)} />
                  <CellSmall align="right" color="textSecondary">
                    {!startedAt ? '-' : DateTime.fromISO(startedAt).toFormat('yyyy/LL/dd')}
                  </CellSmall>
                </Item>
              )
            })}
            {downgradingTo && (
              <DowngradeInfo variant="caption">
                {translate('text_62681c60582e4f00aa82938a', {
                  planName: downgradingTo?.plan?.name,
                  dateStartNewPlan: DateTime.fromISO(downgradingTo?.startedAt).toFormat(
                    'yyyy/LL/dd'
                  ),
                })}
              </DowngradeInfo>
            )}
          </>
        )}

        <AddPlanToCustomerDialog
          ref={addPlanToCustomerDialogRef}
          customerName={customerName}
          customerId={customerId}
          existingPlanIds={selectedPlansId}
          refetchCustomer={refetchCustomer}
        />
      </SideSection>
    )
  }
)

CustomerSubscriptionsList.displayName = 'CustomerSubscriptionsList'

const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const CellBigHeader = styled(Typography)`
  flex: 1;
`

const CellBig = styled(Typography)`
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;

  > *:first-child {
    margin-right: ${theme.spacing(3)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const CellStatus = styled(Status)`
  width: 112px;
`

const NameBlock = styled.div`
  min-width: 0;
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const DowngradeInfo = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: end;
  box-shadow: ${theme.shadows[7]};
`
