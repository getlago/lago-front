import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  TerminateCustomerSubscriptionDialog,
  TerminateCustomerSubscriptionDialogRef,
} from '~/components/customers/subscriptions/TerminateCustomerSubscriptionDialog'
import {
  Avatar,
  Button,
  Icon,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import SkeletonDetailsPage, { LoadingSkeletonWrapper } from '~/components/SkeletonDetailsPage'
import SubscriptionDetailsOverview from '~/components/subscriptions/SubscriptionDetailsOverview'
import SubscriptionUsageTabContent from '~/components/subscriptions/SubscriptionUsageTabContent'
import { addToast } from '~/core/apolloClient'
import {
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  UPDATE_SUBSCRIPTION,
  UPGRADE_DOWNGRADE_SUBSCRIPTION,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { StatusTypeEnum, useGetSubscriptionForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader, theme } from '~/styles'

import { PlanDetailsTabsOptionsEnum } from './PlanDetails'

export enum CustomerSubscriptionDetailsTabsOptionsEnum {
  overview = 'overview',
  usage = 'usage',
}

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
  const { hasPermissions } = usePermissions()
  const { planId, customerId, subscriptionId } = useParams()
  const { translate } = useInternationalization()
  const terminateSubscriptionDialogRef = useRef<TerminateCustomerSubscriptionDialogRef>(null)
  const { data: subscriptionResult, loading: isSubscriptionLoading } =
    useGetSubscriptionForDetailsQuery({
      variables: { subscriptionId: subscriptionId as string },
      skip: !subscriptionId,
    })
  const subscription = subscriptionResult?.subscription

  return (
    <>
      <PageHeader $withSide>
        <HeaderInlineBreadcrumbBlock>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              if (!!customerId) {
                navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId }))
              } else if (!!planId && !isSubscriptionLoading && subscription) {
                navigate(
                  generatePath(PLAN_DETAILS_ROUTE, {
                    planId: subscription?.plan?.parent?.id || planId,
                    tab: PlanDetailsTabsOptionsEnum.subscriptions,
                  }),
                )
              }
            }}
          />
          {isSubscriptionLoading ? (
            <TitleSkeletonWrapper>
              <Skeleton variant="text" width={200} height={12} />
            </TitleSkeletonWrapper>
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate('text_6529666e71f6ce006d2bf011', {
                planName: subscription?.plan?.parent?.name || subscription?.plan.name,
              })}
            </Typography>
          )}
        </HeaderInlineBreadcrumbBlock>
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
                        name: subscription?.name,
                        status: subscription?.status as StatusTypeEnum,
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
      </PageHeader>
      <PlanBlockWrapper>
        <Avatar variant="connector" size="large">
          <Icon name="clock" color="dark" size="large" />
        </Avatar>
        <PlanBlockInfos>
          {isSubscriptionLoading ? (
            <>
              <Skeleton variant="text" width={200} height={16} marginBottom={18} />
              <Skeleton variant="text" width={200} height={12} />
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
        </PlanBlockInfos>
      </PlanBlockWrapper>
      {isSubscriptionLoading ? (
        <ContentContainer>
          <TabContentWrapper>
            <LoadingSkeletonWrapper>
              <SkeletonDetailsPage />
              <SkeletonDetailsPage />
            </LoadingSkeletonWrapper>
          </TabContentWrapper>
        </ContentContainer>
      ) : (
        <NavigationTab
          leftSpacing={48}
          tabs={[
            {
              title: translate('text_628cf761cbe6820138b8f2e4'),
              link: generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: subscription?.customer?.id as string,
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
              }),
              match: [
                generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                  customerId: subscription?.customer?.id as string,
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
                <ContentContainer>
                  <TabContentWrapper>
                    <SubscriptionDetailsOverview />
                  </TabContentWrapper>
                </ContentContainer>
              ),
            },
            {
              title: translate('text_1725983967306cei92rkdtvb'),
              link: generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: subscription?.customer?.id as string,
                subscriptionId: subscriptionId as string,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.usage,
              }),
              component: (
                <ContentContainer>
                  <TabContentWrapper>
                    <SubscriptionUsageTabContent />
                  </TabContentWrapper>
                </ContentContainer>
              ),
            },
          ]}
        />
      )}

      <TerminateCustomerSubscriptionDialog ref={terminateSubscriptionDialogRef} />
    </>
  )
}

export default SubscriptionDetails

const ContentContainer = styled.div`
  padding: 0 ${theme.spacing(12)} ${theme.spacing(20)};
  box-sizing: border-box;
`

const TabContentWrapper = styled.div`
  max-width: 672px;
`

const HeaderInlineBreadcrumbBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Prevent long name to not overflow in header */
  overflow: hidden;
`

const PlanBlockWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  align-items: center;
  margin-bottom: ${theme.spacing(8)};
  padding: ${theme.spacing(8)} ${theme.spacing(12)} 0;
`

const PlanBlockInfos = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${theme.spacing(1)};
  /* Used to hide text overflow */
  overflow: hidden;
`

const TitleSkeletonWrapper = styled.div`
  width: 200px;
`
