import { forwardRef, MutableRefObject, ForwardedRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { DateTime } from 'luxon'

import { theme, NAV_HEIGHT, MenuPopper } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SubscriptionLinePlanFragment, StatusTypeEnum } from '~/generated/graphql'
import {
  Typography,
  Button,
  Avatar,
  Icon,
  Status,
  StatusEnum,
  Popper,
  Tooltip,
  Skeleton,
} from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'

import { AddSubscriptionDrawerRef } from './AddSubscriptionDrawer'
import { EditCustomerSubscriptionDrawerRef } from './EditCustomerSubscriptionDrawer'
import { TerminateCustomerSubscriptionDialogRef } from './TerminateCustomerSubscriptionDialog'

gql`
  fragment SubscriptionLinePlan on Plan {
    id
    name
    code
  }
`

interface SubscriptionLineProps {
  subscriptionId: string
  subscriptionExternalId: string
  subscriptionName?: string | null
  date: string
  plan: SubscriptionLinePlanFragment
  periodEndDate: string
  isDowngrade?: boolean
  status?: StatusTypeEnum | null
}

export interface SubscriptionLineRef {
  addSubscriptionDialogRef: ForwardedRef<AddSubscriptionDrawerRef> | null
  editSubscriptionDrawerRef: ForwardedRef<EditCustomerSubscriptionDrawerRef> | null
  terminateSubscriptionDialogRef: ForwardedRef<TerminateCustomerSubscriptionDialogRef> | null
}

export const SubscriptionLine = forwardRef<SubscriptionLineRef, SubscriptionLineProps>(
  (
    {
      subscriptionId,
      subscriptionExternalId,
      subscriptionName,
      date,
      plan,
      periodEndDate,
      isDowngrade,
      status,
    }: SubscriptionLineProps,
    ref
  ) => {
    const { translate } = useInternationalization()
    const { addSubscriptionDialogRef, editSubscriptionDrawerRef, terminateSubscriptionDialogRef } =
      (ref as MutableRefObject<SubscriptionLineRef>)?.current

    return (
      <Item>
        <CellBig>
          <Avatar variant="connector">
            <Icon name="clock" color="dark" />
          </Avatar>
          <NameBlock>
            <Typography color="textSecondary" variant="bodyHl" noWrap>
              {subscriptionName || plan.name}
            </Typography>
            <Typography variant="caption" noWrap>
              {plan.code}
            </Typography>
          </NameBlock>
        </CellBig>
        <CellStatus
          type={status === StatusTypeEnum.Pending ? StatusEnum.paused : StatusEnum.running}
          label={
            status === StatusTypeEnum.Pending
              ? translate('text_624efab67eb2570101d117f6')
              : translate('text_624efab67eb2570101d1180e')
          }
        />
        <CellSmall align="right" color="textSecondary">
          {DateTime.fromISO(date).toFormat('LLL. dd, yyyy')}
        </CellSmall>
        {isDowngrade ? (
          <Button disabled icon="dots-horizontal" variant="quaternary" />
        ) : (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={({ isOpen }) => (
              <div>
                <Tooltip
                  placement="top-end"
                  disableHoverListener={isOpen}
                  title={translate('text_62d7f6178ec94cd09370e6cf')}
                >
                  <Button icon="dots-horizontal" variant="quaternary" />
                </Tooltip>
              </div>
            )}
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  startIcon="text"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    ;(
                      editSubscriptionDrawerRef as MutableRefObject<EditCustomerSubscriptionDrawerRef>
                    )?.current?.openDrawer({
                      id: subscriptionId,
                      name: subscriptionName,
                      startDate: date,
                      status: status as StatusTypeEnum,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_62d7f6178ec94cd09370e63c')}
                </Button>

                <Button
                  startIcon="pen"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    ;(
                      addSubscriptionDialogRef as MutableRefObject<AddSubscriptionDrawerRef>
                    )?.current?.openDialog({
                      subscriptionId,
                      existingPlanId: plan.id,
                      periodEndDate: periodEndDate,
                      startDate: date,
                      status: status as StatusTypeEnum,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_62d7f6178ec94cd09370e64a')}
                </Button>
                <Button
                  startIcon="duplicate"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigator.clipboard.writeText(subscriptionExternalId)
                    addToast({
                      severity: 'info',
                      translateKey: 'text_62d94cc9ccc5eebcc03160a0',
                    })
                    closePopper()
                  }}
                >
                  {translate('text_62d7f6178ec94cd09370e65b')}
                </Button>
                <Button
                  startIcon="trash"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    ;(
                      terminateSubscriptionDialogRef as MutableRefObject<TerminateCustomerSubscriptionDialogRef>
                    )?.current?.openDialog({
                      id: subscriptionId,
                      name: subscriptionName || plan.name,
                    })
                    closePopper()
                  }}
                >
                  {translate('text_62d904b97e690a881f2b867c')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </Item>
    )
  }
)

SubscriptionLine.displayName = 'SubscriptionLine'

export const SubscriptionLineSkeleton = () => {
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

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(4)};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
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

const CellStatus = styled(Status)`
  width: 88px;
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const NameBlock = styled.div`
  min-width: 0;
`
