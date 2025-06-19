import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, NavigationTab, Popper, Skeleton, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { DeletePlanDialog, DeletePlanDialogRef } from '~/components/plans/DeletePlanDialog'
import { PlanDetailsActivityLogs } from '~/components/plans/details/PlanDetailsActivityLogs'
import { PlanDetailsOverview } from '~/components/plans/details/PlanDetailsOverview'
import PlanSubscriptionList from '~/components/plans/details/PlanSubscriptionList'
import { updateDuplicatePlanVar } from '~/core/apolloClient'
import { PlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
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
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

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
  const { isPremium } = useCurrentUser()

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
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
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
            <div className="w-50">
              <Skeleton variant="text" className="w-50" />
            </div>
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate('text_65281f686a80b400c8e2f6ad', { planName: plan?.name })}
            </Typography>
          )}
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
        </PageHeader.Group>
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
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={isPlanLoading}
        icon="puzzle"
        title={translate('text_65281f686a80b400c8e2f6ad', { planName: plan?.name })}
        description={plan?.code || ''}
      />

      <NavigationTab
        className="px-4 md:px-12"
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
              <DetailsPage.Container>
                <PlanDetailsOverview planId={planId} />
              </DetailsPage.Container>
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
              <DetailsPage.Container className="max-w-full">
                <PlanSubscriptionList planCode={plan?.code} />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(PLAN_DETAILS_ROUTE, {
              planId: planId as string,
              tab: PlanDetailsTabsOptionsEnum.activityLogs,
            }),
            component: <PlanDetailsActivityLogs planId={planId as string} />,
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />
      <DeletePlanDialog ref={deletePlanDialogRef} />
    </>
  )
}

export default PlanDetails
