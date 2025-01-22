import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import {
  ActionItem,
  Icon,
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
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CREATE_SUBSCRIPTION,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  UPDATE_SUBSCRIPTION,
  UPGRADE_DOWNGRADE_SUBSCRIPTION,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  Plan,
  StatusTypeEnum,
  Subscription,
  TimezoneEnum,
  useGetCustomerSubscriptionForListQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

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
          name
          interval
        }
        ...SubscriptionItem
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
  status?: Subscription['status']
  frequency: Plan['interval']
  statusType: {
    type: StatusType
    label: string
  }
  isDowngrade?: boolean
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
      nextPendingStartDate,
      externalId,
      nextName,
      name,
      startedAt,
      subscriptionAt,
      endingAt,
      customer,
    } = subscription || {}

    const isDowngrading = !!nextPlan

    const _sub = {
      id,
      externalId,
      name: name || plan.name,
      status,
      startedAt: startedAt || subscriptionAt,
      endingAt: endingAt,
      frequency: plan.interval,
      startDate: startedAt || subscriptionAt,
      statusType: {
        ...(status === StatusTypeEnum.Pending
          ? {
              type: StatusType.default,
              label: 'pending',
            }
          : {
              type: StatusType.success,
              label: 'active',
            }),
      },
      customerId: customer?.id,
    }

    const _subDowngrade = isDowngrading &&
      nextPlan && {
        id: nextPlan.id,
        name: nextName || nextPlan.name,
        frequency: nextPlan.interval,
        startedAt: nextPendingStartDate,
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
  terminateSubscriptionDialogRef: React.RefObject<TerminateCustomerSubscriptionDialogRef>
  translate: TranslateFunc
  navigate: NavigateFunction
}) => {
  let actions: ActionItem<AnnotatedSubscription>[] = []

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

  actions = actions.concat({
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
          status: status as StatusTypeEnum,
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
        <Typography>{translate('text_6250304370f0f700a8fdc28f')}</Typography>
      )}

      {!hasNoSubscription && (
        <>
          <Table
            name="customer-subscriptions"
            data={annotatedSubscriptions || []}
            containerSize={0}
            isLoading={loading}
            onRowActionLink={({ id, isDowngrade }) =>
              isDowngrade
                ? ''
                : generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    subscriptionId: id,
                    tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
                  })
            }
            columns={[
              {
                key: 'name',
                maxSpace: true,
                title: translate('text_6253f11816f710014600b9ed'),
                content: ({ name, isDowngrade }) => (
                  <>
                    <div className="relative flex items-center gap-3 pl-1">
                      {isDowngrade && <Icon name="arrow-indent" />}

                      <Typography className="text-base font-medium text-grey-700">
                        {name}
                      </Typography>

                      {isDowngrade && <Status type={StatusType.default} label="downgrade" />}
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
                content: ({ startedAt }) => (
                  <TimezoneDate
                    mainTypographyProps={{
                      className: 'text-nowrap text-base font-normal text-grey-600',
                    }}
                    date={startedAt}
                    customerTimezone={customerTimezone}
                  />
                ),
              },
              {
                key: 'endingAt',
                title: translate('text_65201c5a175a4b0238abf2a0'),
                content: ({ endingAt }) =>
                  endingAt ? (
                    <TimezoneDate
                      mainTypographyProps={{
                        className: 'text-nowrap text-base font-normal text-grey-600',
                      }}
                      date={endingAt}
                      customerTimezone={customerTimezone}
                    />
                  ) : (
                    <Typography>-</Typography>
                  ),
              },
              {
                key: 'statusType.type',
                title: translate('text_62d7f6178ec94cd09370e5fb'),
                content: ({ statusType }) => <Status {...(statusType as StatusProps)} />,
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
