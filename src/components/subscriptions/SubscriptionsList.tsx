import { FC, RefObject, useRef } from 'react'
import { generatePath, NavigateFunction, useNavigate } from 'react-router-dom'

import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog'
import { ActionItem, StatusProps, StatusType, Table, TableProps } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { subscriptionStatusMapping } from '~/core/constants/statusSubscriptionMapping'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  UPDATE_SUBSCRIPTION,
  UPGRADE_DOWNGRADE_SUBSCRIPTION,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  NextSubscriptionTypeEnum,
  Plan,
  StatusTypeEnum,
  Subscription,
  TimezoneEnum,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

type AnnotatedSubscription = {
  id: string
  externalId?: Subscription['externalId']
  name: Subscription['name']
  startedAt: Subscription['startedAt']
  endingAt?: Subscription['endingAt']
  terminatedAt?: Subscription['terminatedAt']
  status?: Subscription['status']
  frequency: Plan['interval']
  statusType: StatusProps
  payInAdvance: boolean
  isDowngrade?: boolean
  isScheduled?: boolean
  isOverriden?: boolean
  customer: {
    id: string
    name?: string
    displayName?: string
    applicableTimezone: TimezoneEnum
  }
}

const annotateSubscriptions = (
  subscriptions: Subscription[] | null | undefined,
  {
    customerTimezone,
    customerId,
  }: {
    customerTimezone?: TimezoneEnum
    customerId?: string
  },
): AnnotatedSubscription[] => {
  return (subscriptions || []).reduce<AnnotatedSubscription[]>((subsAcc, subscription) => {
    const {
      id,
      plan,
      status,
      nextPlan,
      nextSubscriptionAt,
      nextSubscriptionType,
      externalId,
      nextName,
      name,
      startedAt,
      subscriptionAt,
      endingAt,
      terminatedAt,
      customer,
      nextSubscription,
    } = subscription || {}

    const isDowngrading = !!nextPlan && nextSubscriptionType === NextSubscriptionTypeEnum.Downgrade

    const _sub = {
      id,
      externalId,
      name: name || plan.name,
      status,
      startedAt: startedAt || subscriptionAt,
      endingAt: endingAt,
      terminatedAt,
      frequency: plan.interval,
      statusType: subscriptionStatusMapping(status),
      payInAdvance: !!plan.payInAdvance,
      customer: {
        id: customerId || customer?.id,
        name: customer?.name || undefined,
        displayName: customer?.displayName,
        applicableTimezone: customerTimezone || customer?.applicableTimezone,
      },
      isScheduled: status === StatusTypeEnum.Pending,
      isOverriden: !!plan.isOverridden,
    }

    const _subDowngrade = isDowngrading &&
      status !== StatusTypeEnum.Terminated &&
      nextPlan && {
        id: nextSubscription?.id || nextPlan.id,
        externalId: nextSubscription?.externalId,
        name: nextSubscription?.name || nextName || nextPlan.name,
        status: nextSubscription?.status,
        frequency: nextPlan.interval,
        startedAt: nextSubscriptionAt,
        statusType: {
          type: StatusType.default,
          label: 'pending',
        } as StatusProps,
        payInAdvance: !!plan.payInAdvance,
        isDowngrade: true,
        isOverriden: !!nextPlan.parent,
        customer: {
          id: customerId || customer?.id,
          name: customer?.name || undefined,
          displayName: customer?.displayName,
          applicableTimezone: customerTimezone || customer?.applicableTimezone,
        },
      }

    return [...subsAcc, _sub, ...(_subDowngrade ? [_subDowngrade] : [])]
  }, [])
}

const generateActionColumn = ({
  subscription,
  hasSubscriptionsUpdatePermission,
  terminateSubscriptionDialogRef,
  translate,
  navigate,
}: {
  subscription: AnnotatedSubscription
  hasSubscriptionsUpdatePermission: boolean
  terminateSubscriptionDialogRef: RefObject<TerminateCustomerSubscriptionDialogRef>
  translate: TranslateFunc
  navigate: NavigateFunction
}) => {
  let actions: ActionItem<AnnotatedSubscription>[] = []

  const copyToClipboardAction: ActionItem<AnnotatedSubscription> = {
    startIcon: 'duplicate',
    title: translate('text_62d7f6178ec94cd09370e65b'),
    onAction: () => {
      if (!subscription.externalId) return

      copyToClipboard(subscription.externalId)

      addToast({
        severity: 'info',
        translateKey: 'text_62d94cc9ccc5eebcc03160a0',
      })
    },
  }

  if (
    subscription.status === StatusTypeEnum.Terminated ||
    subscription.status === StatusTypeEnum.Canceled
  ) {
    return [copyToClipboardAction]
  }

  if (!subscription.isDowngrade && hasSubscriptionsUpdatePermission) {
    actions = actions.concat([
      {
        startIcon: 'text',
        title: translate('text_62d7f6178ec94cd09370e63c'),
        onAction: () =>
          navigate(
            generatePath(UPDATE_SUBSCRIPTION, {
              customerId: subscription.customer.id,
              subscriptionId: subscription.id,
            }),
          ),
      },
      {
        startIcon: 'pen',
        title: translate('text_62d7f6178ec94cd09370e64a'),
        onAction: () =>
          navigate(
            generatePath(UPGRADE_DOWNGRADE_SUBSCRIPTION, {
              customerId: subscription.customer.id,
              subscriptionId: subscription.id,
            }),
          ),
      },
    ])
  }

  actions = actions.concat(copyToClipboardAction)

  actions = actions.concat({
    startIcon: 'bell',
    title: translate('text_1746785137190vu5wwlsmzmz'),
    onAction: () => {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId: subscription.customer.id,
          subscriptionId: subscription.id,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
        }),
      )
    },
  })

  if (hasSubscriptionsUpdatePermission) {
    actions = actions.concat({
      startIcon: 'trash',
      title:
        subscription.status === StatusTypeEnum.Pending
          ? translate('text_64a6d736c23125004817627f')
          : translate('text_62d904b97e690a881f2b867c'),
      onAction: () =>
        terminateSubscriptionDialogRef?.current?.openDialog({
          id: subscription.id,
          name: subscription.name as string,
          status: subscription.status as StatusTypeEnum,
          payInAdvance: subscription.payInAdvance,
        }),
    })
  }

  return actions
}

interface SubscriptionsListProps extends Omit<TableProps<AnnotatedSubscription>, 'data'> {
  subscriptions: Subscription[]
  customerTimezone?: TimezoneEnum
  customerId?: string
}

export const SubscriptionsList: FC<SubscriptionsListProps> = ({
  subscriptions,
  customerTimezone,
  customerId,
  ...tableProps
}) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)

  const annotatedSubscriptions = annotateSubscriptions(subscriptions, {
    customerTimezone,
    customerId,
  })

  return (
    <>
      <Table
        {...tableProps}
        data={annotatedSubscriptions || []}
        rowDataTestId={(subscription) => subscription.name || `subscription-${subscription.id}`}
        actionColumn={(subscription) =>
          generateActionColumn({
            subscription,
            navigate,
            translate,
            terminateSubscriptionDialogRef,
            hasSubscriptionsUpdatePermission: hasPermissions(['subscriptionsUpdate']),
          })
        }
      />

      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </>
  )
}
