import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { DeletePlanDialog, DeletePlanDialogRef } from '~/components/plans/DeletePlanDialog'
import { PlanDetailsActivityLogs } from '~/components/plans/details/PlanDetailsActivityLogs'
import { PlanDetailsOverview } from '~/components/plans/details/PlanDetailsOverview'
import PlanSubscriptionList from '~/components/plans/details/PlanSubscriptionList'
import { updateDuplicatePlanVar } from '~/core/apolloClient'
import { PlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  CREATE_PLAN_ROUTE,
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

  useEffect(() => {
    // WARNING: This page should not be used to show overriden plan's details
    // If a parent plan is detected, redirect to the plans list
    if (!!plan?.parent?.id) {
      navigate(PLANS_ROUTE, { replace: true })
    }
  }, [navigate, plan?.parent?.id])

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      items: [
        {
          label: translate('text_65281f686a80b400c8e2f6b3'),
          hidden: !hasPermissions(['plansUpdate']),
          onClick: (closePopper) => {
            navigate(generatePath(UPDATE_PLAN_ROUTE, { planId: plan?.id as string }))
            closePopper()
          },
        },
        {
          label: translate('text_65281f686a80b400c8e2f6b6'),
          hidden: !hasPermissions(['plansCreate']),
          onClick: (closePopper) => {
            updateDuplicatePlanVar({
              type: 'duplicate',
              parentId: plan?.id,
            })
            navigate(CREATE_PLAN_ROUTE)
            closePopper()
          },
        },
        {
          label: translate('text_625fd165963a7b00c8f597b5'),
          hidden: !hasPermissions(['plansDelete']),
          onClick: (closePopper) => {
            deletePlanDialogRef.current?.openDialog({
              plan: plan as DeletePlanDialogFragment,
              callback: () => {
                navigate(PLANS_ROUTE)
              },
            })
            closePopper()
          },
        },
      ],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[{ label: translate('text_62442e40cea25600b0b6d84a'), path: PLANS_ROUTE }]}
        entity={{
          viewName: translate('text_65281f686a80b400c8e2f6ad', { planName: plan?.name }),
          metadata: plan?.code || '',
        }}
        actions={actions}
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
            content: (
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
            content: (
              <DetailsPage.Container>
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
            content: <PlanDetailsActivityLogs planId={planId as string} />,
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
        isLoading={isPlanLoading}
      />

      <>{activeTabContent}</>

      <DeletePlanDialog ref={deletePlanDialogRef} />
    </>
  )
}

export default PlanDetails
