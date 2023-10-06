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
import SubscriptionDetailsOverview from '~/components/subscriptions/SubscriptionDetailsOverview'
import { addToast } from '~/core/apolloClient'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { StatusTypeEnum, useGetSubscriptionForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper, PageHeader, theme } from '~/styles'

export enum CustomerSubscriptionDetailsTabsOptionsEnum {
  overview = 'overview',
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
      }
    }
  }
`

const SubscriptionDetails = () => {
  const navigate = useNavigate()
  const { customerId, subscriptionId } = useParams()
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
              if (customerId) {
                navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId }))
              }
            }}
          />
          {isSubscriptionLoading ? (
            <Skeleton variant="text" width={200} height={24} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {subscription?.plan.name}
            </Typography>
          )}
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
        </HeaderInlineBreadcrumbBlock>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              {/* <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  // subscriptionsDialogRef?.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('TODO: Edit subscription')}
              </Button> */}
              {/* <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  // navigate(generatePath(CREATE_INVOICE_ROUTE, { id: id as string }))

                  closePopper()
                }}
              >
                {translate('TODO: Upgrade/downgrade plan')}
              </Button> */}
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
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  terminateSubscriptionDialogRef.current?.openDialog({
                    id: subscription?.id as string,
                    name: subscription?.name,
                    status: subscription?.status as StatusTypeEnum,
                    callback: () => {
                      navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
                    },
                  })
                  closePopper()
                }}
              >
                {translate('text_62d904b97e690a881f2b867c')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
      </PageHeader>
      <PlanBlockWrapper>
        <Avatar variant="connector" size="large">
          <Icon name="clock" color="dark" size="large" />
        </Avatar>
        <PlanBlockInfos>
          <Typography variant="headline" color="grey700" noWrap>
            {subscription?.plan.name}
          </Typography>
          <Typography variant="body" color="grey600" noWrap>
            {subscription?.plan.code}
          </Typography>
        </PlanBlockInfos>
      </PlanBlockWrapper>
      <NavigationTab
        align="superLeft"
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
              customerId: customerId as string,
              subscriptionId: subscriptionId as string,
              tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
            }),
            routerState: { disableScrollTop: true },
            match: [
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customerId as string,
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
        ]}
      />

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
  flex-direction: column;
  gap: ${theme.spacing(1)};
  /* Used to hide text overflow */
  overflow: hidden;
`
