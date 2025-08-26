import { gql } from '@apollo/client'
import { Avatar, ButtonLink, Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog'
import { Button, NavigationTab, Popper, Skeleton, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SubscriptionActivityLogs } from '~/components/subscriptions/SubscriptionActivityLogs'
import { SubscriptionAlertsList } from '~/components/subscriptions/SubscriptionAlertsList'
import { SubscriptionDetailsOverview } from '~/components/subscriptions/SubscriptionDetailsOverview'
import { SubscriptionEntitlementsTabContent } from '~/components/subscriptions/SubscriptionEntitlementsTabContent'
import { SubscriptionUsageTabContent } from '~/components/subscriptions/SubscriptionUsageTabContent'
import { addToast } from '~/core/apolloClient'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CREATE_ALERT_CUSTOMER_SUBSCRIPTION_ROUTE,
  CREATE_ALERT_PLAN_SUBSCRIPTION_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  SUBSCRIPTIONS_ROUTE,
  UPDATE_SUBSCRIPTION,
  UPGRADE_DOWNGRADE_SUBSCRIPTION,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { StatusTypeEnum, useGetSubscriptionForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  query getSubscriptionForDetails($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      name
      status
      externalId
      plan {
        id
        name
        code
        payInAdvance
        parent {
          id
          name
          code
        }
      }
      customer {
        id
      }
    }
  }
`

const SubscriptionDetails = () => {
  const navigate = useNavigate()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { planId = '', customerId = '', subscriptionId = '' } = useParams()
  const { translate } = useInternationalization()
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)
  const { data: subscriptionResult, loading: isSubscriptionLoading } =
    useGetSubscriptionForDetailsQuery({
      variables: { subscriptionId: subscriptionId as string },
      skip: !subscriptionId,
    })

  const { goBack } = useLocationHistory()

  const subscription = subscriptionResult?.subscription

  const canCreateOrUpdateAlert = useMemo(() => {
    return hasPermissions(['subscriptionsCreate', 'subscriptionsUpdate'])
  }, [hasPermissions])

  const getAlertCreationLink = useMemo(() => {
    if (!isPremium) {
      return `mailto:hello@getlago.com?subject=${translate('text_174652384902646b3ma52uww')}&body=${translate('text_1746523849026ljzi79afhmq')}`
    }

    if (!!customerId) {
      return generatePath(CREATE_ALERT_CUSTOMER_SUBSCRIPTION_ROUTE, {
        customerId,
        subscriptionId,
      })
    }

    return generatePath(CREATE_ALERT_PLAN_SUBSCRIPTION_ROUTE, {
      planId,
      subscriptionId,
    })
  }, [isPremium, customerId, planId, subscriptionId, translate])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => goBack(generatePath(SUBSCRIPTIONS_ROUTE))}
          />
          {isSubscriptionLoading ? (
            <Skeleton variant="text" className="w-50" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate('text_6529666e71f6ce006d2bf011', {
                planName: subscription?.plan?.parent?.name || subscription?.plan.name,
              })}
            </Typography>
          )}
        </PageHeader.Group>
        {!isSubscriptionLoading && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button data-test="subscription-details-actions" endIcon="chevron-down">
                {translate('text_626162c62f790600f850b6fe')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                {hasPermissions(['subscriptionsUpdate']) && (
                  <>
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(UPDATE_SUBSCRIPTION, {
                            customerId: subscription?.customer?.id as string,
                            subscriptionId: subscriptionId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_62d7f6178ec94cd09370e63c')}
                    </Button>
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(UPGRADE_DOWNGRADE_SUBSCRIPTION, {
                            customerId: subscription?.customer?.id as string,
                            subscriptionId: subscriptionId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_62d7f6178ec94cd09370e64a')}
                    </Button>
                  </>
                )}
                {canCreateOrUpdateAlert && (
                  <ButtonLink
                    type="button"
                    buttonProps={{
                      fullWidth: true,
                      variant: 'quaternary',
                      align: 'left',
                      endIcon: !isPremium ? 'sparkles' : undefined,
                    }}
                    to={getAlertCreationLink}
                  >
                    {translate('text_174652384902646b3ma52uws')}
                  </ButtonLink>
                )}
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    copyToClipboard(subscription?.externalId || '')

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
                    data-test="subscription-details-terminate"
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      terminateSubscriptionDialogRef.current?.openDialog({
                        id: subscription?.id as string,
                        name: subscription?.name as string,
                        status: subscription?.status as StatusTypeEnum,
                        payInAdvance: !!subscription?.plan.payInAdvance,
                        callback: () => {
                          navigate(
                            generatePath(CUSTOMER_DETAILS_ROUTE, {
                              customerId: subscription?.customer?.id as string,
                            }),
                          )
                        },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_62d904b97e690a881f2b867c')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      <div className="mb-8 flex items-center gap-4 px-12 pt-8">
        <Avatar variant="connector" size="large">
          <Icon name="clock" color="dark" size="large" />
        </Avatar>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {isSubscriptionLoading ? (
            <>
              <Skeleton variant="text" className="w-50" />
              <Skeleton variant="text" className="w-30" />
            </>
          ) : (
            <>
              <Typography variant="headline" color="grey700" noWrap>
                {translate('text_6529666e71f6ce006d2bf011', { planName: subscription?.plan.name })}
              </Typography>
              <Typography variant="body" color="grey600" noWrap>
                {subscription?.plan.code}
              </Typography>
            </>
          )}
        </div>
      </div>

      <NavigationTab
        className="px-4 md:px-12"
        loading={isSubscriptionLoading}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: !!customerId
              ? generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                  customerId,
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
                })
              : generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                  planId: planId || '',
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
                }),
            match: [
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
              }),
              generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                planId: planId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
              }),
            ],
            component: (
              <DetailsPage.Container>
                <SubscriptionDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_63e26d8308d03687188221a6'),
            link: !!customerId
              ? generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                  customerId,
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
                })
              : generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                  planId: planId || '',
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
                }),
            match: [
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
              }),
              generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                planId: planId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
              }),
            ],
            component: (
              <DetailsPage.Container>
                <SubscriptionEntitlementsTabContent />
              </DetailsPage.Container>
            ),
          },
          ...(subscription?.status !== StatusTypeEnum.Canceled &&
          subscription?.status !== StatusTypeEnum.Terminated
            ? [
                {
                  title: translate('text_1725983967306cei92rkdtvb'),
                  link: !!customerId
                    ? generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                        customerId,
                        subscriptionId: subscriptionId as string,
                        tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
                      })
                    : generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                        planId: planId || '',
                        subscriptionId: subscriptionId as string,
                        tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
                      }),
                  match: [
                    generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                      customerId: customerId || '',
                      subscriptionId: subscriptionId as string,
                      tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
                    }),
                    generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                      planId: planId || '',
                      subscriptionId: subscriptionId as string,
                      tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
                    }),
                  ],
                  component: (
                    <DetailsPage.Container>
                      <SubscriptionUsageTabContent />
                    </DetailsPage.Container>
                  ),
                },
              ]
            : []),
          {
            title: translate('text_17465238490269pahbvl3s2m'),
            link: !!customerId
              ? generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                  customerId,
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
                })
              : generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                  planId: planId || '',
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
                }),
            match: [
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
              }),
              generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                planId: planId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.alerts,
              }),
            ],
            component: (
              <DetailsPage.Container>
                <SubscriptionAlertsList subscriptionExternalId={subscription?.externalId} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: !!customerId
              ? generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                  customerId,
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.activityLogs,
                })
              : generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                  planId: planId || '',
                  subscriptionId: subscriptionId as string,
                  tab: CustomerSubscriptionDetailsTabsOptionsEnum.activityLogs,
                }),
            match: [
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.activityLogs,
              }),
              generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
                planId: planId || '',
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.activityLogs,
              }),
            ],
            component: (
              <DetailsPage.Container className="max-w-none">
                <SubscriptionActivityLogs externalSubscriptionId={subscription?.externalId || ''} />
              </DetailsPage.Container>
            ),
            hidden: !subscription?.externalId || !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </>
  )
}

export default SubscriptionDetails
