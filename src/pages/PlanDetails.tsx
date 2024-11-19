import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { DeletePlanDialog, DeletePlanDialogRef } from '~/components/plans/DeletePlanDialog'
import PlanDetailsOverview from '~/components/plans/details/PlanDetailsOverview'
import PlanSubscriptionList from '~/components/plans/details/PlanSubscriptionList'
import { updateDuplicatePlanVar } from '~/core/apolloClient'
import {
  CREATE_PLAN_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_PLAN_DETAILS,
  PLAN_DETAILS_ROUTE,
  PLANS_ROUTE,
  UPDATE_PLAN_ROUTE,
} from '~/core/router'
import {
  DeletePlanDialogFragment,
  DeletePlanDialogFragmentDoc,
  useGetPlanForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader, theme } from '~/styles'

export enum PlanDetailsTabsOptionsEnum {
  overview = 'overview',
  subscriptions = 'subscriptions',
}

gql`
  query getPlanForDetails($planId: ID!) {
    plan(id: $planId) {
      id
      name
      code
      parent {
        id
      }
      ...DeletePlanDialog
    }
  }

  ${DeletePlanDialogFragmentDoc}
`

const PlanDetails = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { customerId, planId, subscriptionId } = useParams()
  const { translate } = useInternationalization()
  const deletePlanDialogRef = useRef<DeletePlanDialogRef>(null)
  const { data: planResult, loading: isPlanLoading } = useGetPlanForDetailsQuery({
    variables: { planId: planId as string },
    skip: !planId,
  })
  const plan = planResult?.plan
  const shouldShowActions = hasPermissions(['plansCreate', 'plansUpdate', 'plansDelete'])

  useEffect(() => {
    // WARNING: This page should not be used to show overriden plan's details
    // If a parent plan is detected, redirect to the plans list
    if (!!plan?.parent?.id) {
      navigate(PLANS_ROUTE, { replace: true })
    }
  }, [navigate, plan?.parent?.id])

  return (
    <>
      <PageHeader $withSide>
        <HeaderInlineBreadcrumbBlock>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              if (!!customerId && !!subscriptionId) {
                navigate(
                  generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    subscriptionId: subscriptionId as string,
                    tab: PlanDetailsTabsOptionsEnum.overview,
                  }),
                )
              } else {
                navigate(PLANS_ROUTE)
              }
            }}
          />
          {isPlanLoading && !plan ? (
            <PlanTitleLoadingWrapper>
              <Skeleton variant="text" className="w-50" />
            </PlanTitleLoadingWrapper>
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate('text_65281f686a80b400c8e2f6ad', { planName: plan?.name })}
            </Typography>
          )}
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
        </HeaderInlineBreadcrumbBlock>
        {shouldShowActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(generatePath(UPDATE_PLAN_ROUTE, { planId: plan?.id as string }))
                    closePopper()
                  }}
                >
                  {translate('text_65281f686a80b400c8e2f6b3')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    updateDuplicatePlanVar({
                      type: 'duplicate',
                      parentId: plan?.id,
                    })
                    navigate(CREATE_PLAN_ROUTE)
                    closePopper()
                  }}
                >
                  {translate('text_65281f686a80b400c8e2f6b6')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deletePlanDialogRef.current?.openDialog({
                      plan: plan as DeletePlanDialogFragment,
                      callback: () => {
                        navigate(PLANS_ROUTE)
                      },
                    })
                    closePopper()
                  }}
                >
                  {translate('text_625fd165963a7b00c8f597b5')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader>
      <PlanBlockWrapper>
        <Avatar variant="connector" size="large">
          <Icon name="board" color="dark" size="large" />
        </Avatar>
        <PlanBlockInfos>
          {isPlanLoading && !plan ? (
            <PlanTitleLoadingWrapper>
              <Skeleton variant="text" className="mb-5 w-50" />
              <Skeleton variant="text" className="w-50" />
            </PlanTitleLoadingWrapper>
          ) : (
            <>
              <Typography variant="headline" color="grey700" noWrap>
                {translate('text_65281f686a80b400c8e2f6ad', { planName: plan?.name })}
              </Typography>
              <Typography variant="body" color="grey600" noWrap>
                {plan?.code}
              </Typography>
            </>
          )}
        </PlanBlockInfos>
      </PlanBlockWrapper>
      <NavigationTab
        className="px-12"
        loading={isPlanLoading}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(PLAN_DETAILS_ROUTE, {
              planId: planId as string,
              tab: PlanDetailsTabsOptionsEnum.overview,
            }),
            match: [
              generatePath(PLAN_DETAILS_ROUTE, {
                planId: planId as string,
                tab: PlanDetailsTabsOptionsEnum.overview,
              }),
              generatePath(CUSTOMER_SUBSCRIPTION_PLAN_DETAILS, {
                customerId: customerId || '',
                subscriptionId: subscriptionId || '',
                planId: planId as string,
                tab: PlanDetailsTabsOptionsEnum.overview,
              }),
            ],
            component: (
              <ContentContainer>
                <TabContentWrapper>
                  <PlanDetailsOverview planId={planId} />
                </TabContentWrapper>
              </ContentContainer>
            ),
          },
          {
            title: translate('text_6250304370f0f700a8fdc28d'),
            link: generatePath(PLAN_DETAILS_ROUTE, {
              planId: planId as string,
              tab: PlanDetailsTabsOptionsEnum.subscriptions,
            }),
            match: [
              generatePath(PLAN_DETAILS_ROUTE, {
                planId: planId as string,
                tab: PlanDetailsTabsOptionsEnum.subscriptions,
              }),
            ],
            component: (
              <ContentContainer>
                <PlanSubscriptionList planCode={plan?.code} />
              </ContentContainer>
            ),
          },
        ]}
      />
      <DeletePlanDialog ref={deletePlanDialogRef} />
    </>
  )
}

export default PlanDetails

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

const PlanTitleLoadingWrapper = styled.div`
  width: 200px;
`
