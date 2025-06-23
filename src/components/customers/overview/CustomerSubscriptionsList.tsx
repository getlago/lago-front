import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { RefObject, useRef } from 'react'
import { generatePath, NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog'
import {
  ActionItem,
  Status,
  StatusProps,
  StatusType,
  Table,
  Typography,
} from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { TimezoneDate } from '~/components/TimezoneDate'
import { addToast } from '~/core/apolloClient'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { subscriptionStatusMapping } from '~/core/constants/statusSubscriptionMapping'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CREATE_SUBSCRIPTION,
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
  useGetCustomerSubscriptionForListQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { tw } from '~/styles/utils'

gql`
  query getCustomerSubscriptionForList($id: ID!) {
    customer(id: $id) {
      id
      subscriptions {
        id
        status
        startedAt
        nextSubscriptionAt
        nextSubscriptionType
        name
        nextName
        externalId
        subscriptionAt
        endingAt
        terminatedAt
        plan {
          id
          amountCurrency
          name
          interval
        }
        nextPlan {
          id
          name
          code
          interval
        }
        nextSubscription {
          id
          name
          externalId
          status
        }
      }
    }
  }
`

interface CustomerSubscriptionsListProps {
  customerTimezone?: TimezoneEnum
}

type AnnotatedSubscription = {
  id: string
  externalId?: Subscription['externalId']
  name: Subscription['name']
  startedAt: Subscription['startedAt']
  endingAt?: Subscription['endingAt']
  terminatedAt?: Subscription['terminatedAt']
  status?: Subscription['status']
  frequency: Plan['interval']
  statusType: {
    type: StatusType
    label: string
  }
  isDowngrade?: boolean
  isScheduled?: boolean
  customerId: string
}

const annotateSubscriptions = (
  subscriptions: Subscription[] | null | undefined,
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
      startDate: startedAt || subscriptionAt,
      statusType: subscriptionStatusMapping(status),
      customerId: customer?.id,
      isScheduled: status === StatusTypeEnum.Pending,
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
        },
        isDowngrade: true,
        customerId: customer?.id,
      }

    return [...subsAcc, _sub, ...(_subDowngrade ? [_subDowngrade] : [])]
  }, [])
}

const generateActionColumn = ({
  subscription,
  hasSubscriptionsUpdatePermission,
  customerId,
  terminateSubscriptionDialogRef,
  translate,
  navigate,
}: {
  subscription: AnnotatedSubscription
  hasSubscriptionsUpdatePermission: boolean
  customerId?: string
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
              customerId: customerId as string,
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
              customerId: customerId as string,
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
          customerId: customerId as string,
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
          name: subscription.name,
          status: subscription.status as StatusTypeEnum,
        }),
    })
  }

  return actions
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
  const subscriptions = data?.customer?.subscriptions as Subscription[]
  const hasNoSubscription = !subscriptions || !subscriptions.length
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)

  const annotatedSubscriptions = annotateSubscriptions(subscriptions)

  return (
    <div>
      <PageSectionTitle
        title={translate('text_6250304370f0f700a8fdc28d')}
        subtitle={translate('text_1736968199827r2u2gd7pypg')}
        action={
          hasPermissions(['subscriptionsCreate'])
            ? {
                title: translate('text_6250304370f0f700a8fdc28b'),
                dataTest: 'add-subscription',
                onClick: () => {
                  navigate(
                    generatePath(CREATE_SUBSCRIPTION, {
                      customerId: customerId as string,
                    }),
                  )
                },
              }
            : undefined
        }
      />

      {!loading && hasNoSubscription && (
        <Typography className="text-grey-500">
          {translate('text_6250304370f0f700a8fdc28f')}
        </Typography>
      )}

      {(!hasNoSubscription || !!loading) && (
        <>
          <Table
            name="customer-subscriptions"
            data={annotatedSubscriptions || []}
            containerSize={4}
            isLoading={loading}
            rowDataTestId={(subscription) => subscription.name || `subscription-${subscription.id}`}
            onRowActionLink={({ id }) =>
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId as string,
                subscriptionId: id,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
              })
            }
            columns={[
              {
                key: 'statusType.type',
                title: translate('text_62d7f6178ec94cd09370e5fb'),
                content: ({ statusType }) => <Status {...(statusType as StatusProps)} />,
              },
              {
                key: 'name',
                maxSpace: true,
                title: translate('text_6253f11816f710014600b9ed'),
                content: ({ name, isDowngrade, isScheduled }) => (
                  <>
                    <div
                      className={tw('relative flex items-center gap-3', {
                        'pl-4': isDowngrade,
                      })}
                    >
                      {isDowngrade && <Icon name="arrow-indent" />}

                      <Typography className="text-base font-medium text-grey-700">
                        {name}
                      </Typography>

                      {isDowngrade && <Status type={StatusType.default} label="downgrade" />}

                      {isScheduled && <Status type={StatusType.default} label="scheduled" />}
                    </div>
                  </>
                ),
              },
              {
                key: 'frequency',
                title: translate('text_1736968618645gg26amx8djq'),
                content: ({ frequency }) => (
                  <Typography>{translate(getIntervalTranslationKey[frequency])}</Typography>
                ),
              },
              {
                key: 'startedAt',
                title: translate('text_65201c5a175a4b0238abf29e'),
                content: ({ startedAt }) =>
                  !!startedAt ? (
                    <TimezoneDate
                      typographyClassName="text-nowrap text-base font-normal text-grey-600"
                      date={startedAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : (
                    <Typography>-</Typography>
                  ),
              },
              {
                key: 'endingAt',
                title: translate('text_65201c5a175a4b0238abf2a0'),
                content: ({ endingAt, status, terminatedAt }) =>
                  endingAt || terminatedAt ? (
                    <TimezoneDate
                      typographyClassName="text-nowrap text-base font-normal text-grey-600"
                      date={status === StatusTypeEnum.Terminated ? terminatedAt : endingAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : (
                    <Typography>-</Typography>
                  ),
              },
            ]}
            actionColumn={(subscription) =>
              generateActionColumn({
                subscription,
                customerId,
                navigate,
                translate,
                terminateSubscriptionDialogRef,
                hasSubscriptionsUpdatePermission: hasPermissions(['subscriptionsUpdate']),
              })
            }
          />
        </>
      )}

      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </div>
  )
}

CustomerSubscriptionsList.displayName = 'CustomerSubscriptionsList'
