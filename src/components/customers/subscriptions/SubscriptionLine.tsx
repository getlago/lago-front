import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  Popper,
  Status,
  StatusEnum,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { addToast } from '~/core/apolloClient'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  UPDATE_SUBSCRIPTION,
  UPGRADE_DOWNGRADE_SUBSCRIPTION,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { StatusTypeEnum, SubscriptionLinePlanFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/pages/SubscriptionDetails'
import { ItemContainer, ListItemLink, MenuPopper, NAV_HEIGHT, PopperOpener, theme } from '~/styles'

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
  hasBottomSection?: boolean
  hasAboveSection?: boolean
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
  hasBottomSection,
  hasAboveSection,
  terminateSubscriptionDialogRef,
}: SubscriptionLineProps) => {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  return (
    <ItemContainer>
      <Item
        tabIndex={0}
        to={generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId: customerId as string,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
        })}
        $hasAboveSection={hasAboveSection}
        $hasBottomSection={hasBottomSection}
        data-test={subscriptionName || plan.name}
      >
        <CellBig>
          <Avatar size="big" variant="connector">
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
        <ButtonMock />
      </Item>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          <LocalPopperOpener>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate('text_646e2d0cc536351b62ba6f01')}
            >
              <Button data-test="menu-subscription" icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </LocalPopperOpener>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            {!isDowngrade && hasPermissions(['subscriptionsUpdate']) && (
              <>
                <Button
                  startIcon="text"
                  variant="quaternary"
                  data-test="edit-subscription"
                  align="left"
                  onClick={() => {
                    navigate(
                      generatePath(UPDATE_SUBSCRIPTION, {
                        customerId: customerId as string,
                        subscriptionId,
                      }),
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
                        customerId: customerId as string,
                        subscriptionId,
                      }),
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

            {hasPermissions(['subscriptionsUpdate']) && (
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
            )}
          </MenuPopper>
        )}
      </Popper>
    </ItemContainer>
  )
}

SubscriptionLine.displayName = 'SubscriptionLine'

const Item = styled(ListItemLink)<{ $hasBottomSection?: boolean; $hasAboveSection?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing(4)};
  box-shadow: none;

  &:hover,
  &:active {
    box-shadow: none;
    border-radius: ${({ $hasBottomSection, $hasAboveSection }) =>
      $hasAboveSection ? '0px' : $hasBottomSection ? '12px 12px 0 0' : '12px'};
  }

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

const ButtonMock = styled.div`
  width: 40px;
`

const LocalPopperOpener = styled(PopperOpener)`
  right: ${theme.spacing(4)};
`
