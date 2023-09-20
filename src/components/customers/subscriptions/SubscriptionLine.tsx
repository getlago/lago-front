import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  Popper,
  Skeleton,
  Status,
  StatusEnum,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { addToast } from '~/core/apolloClient'
import { UPDATE_SUBSCRIPTION, UPGRADE_DOWNGRADE_SUBSCRIPTION } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { StatusTypeEnum, SubscriptionLinePlanFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper, NAV_HEIGHT, theme } from '~/styles'

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
  isDowngrade?: boolean
  status?: StatusTypeEnum | null
  customerTimezone?: TimezoneEnum
  terminateSubscriptionDialogRef: RefObject<TerminateCustomerSubscriptionDialogRef> | null
}

export const SubscriptionLine = ({
  subscriptionId,
  subscriptionExternalId,
  subscriptionName,
  date,
  plan,
  isDowngrade,
  status,
  customerTimezone,
  terminateSubscriptionDialogRef,
}: SubscriptionLineProps) => {
  const navigate = useNavigate()
  const { id: customerId } = useParams()
  const { translate } = useInternationalization()

  return (
    <Item data-test={subscriptionName || plan.name}>
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
        <TimezoneDate date={date} customerTimezone={customerTimezone} />
      </CellSmall>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          <div>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate(
                isDowngrade
                  ? 'text_64a803f70b9bde00529d2aa5'
                  : status === StatusTypeEnum.Pending
                  ? 'text_64a80400248fe50080d66358'
                  : 'text_62d7f6178ec94cd09370e6cf'
              )}
            >
              <Button data-test="menu-subscription" icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </div>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            {!isDowngrade && (
              <>
                <Button
                  startIcon="text"
                  variant="quaternary"
                  data-test="edit-subscription"
                  align="left"
                  onClick={() => {
                    navigate(
                      generatePath(UPDATE_SUBSCRIPTION, {
                        id: customerId as string,
                        subscriptionId,
                      })
                    )
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
                    navigate(
                      generatePath(UPGRADE_DOWNGRADE_SUBSCRIPTION, {
                        id: customerId as string,
                        subscriptionId,
                      })
                    )
                    closePopper()
                  }}
                >
                  {translate('text_62d7f6178ec94cd09370e64a')}
                </Button>
              </>
            )}
            <Button
              startIcon="duplicate"
              variant="quaternary"
              align="left"
              onClick={() => {
                copyToClipboard(subscriptionExternalId)

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
              data-test="terminate-subscription"
              onClick={() => {
                terminateSubscriptionDialogRef?.current?.openDialog({
                  id: subscriptionId,
                  name: subscriptionName || plan.name,
                  status: status as StatusTypeEnum,
                })
                closePopper()
              }}
            >
              {status === StatusTypeEnum.Pending
                ? translate('text_64a6d736c23125004817627f')
                : translate('text_62d904b97e690a881f2b867c')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
    </Item>
  )
}

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
