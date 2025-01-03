import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonLink, InfiniteScroll, Table, Typography } from '~/components/designSystem'
import { DeletePlanDialog, DeletePlanDialogRef } from '~/components/plans/DeletePlanDialog'
import { SearchInput } from '~/components/SearchInput'
import { updateDuplicatePlanVar } from '~/core/apolloClient/reactiveVars/duplicatePlanVar'
import { CREATE_PLAN_ROUTE, PLAN_DETAILS_ROUTE, UPDATE_PLAN_ROUTE } from '~/core/router'
import { DeletePlanDialogFragmentDoc, usePlansLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader, theme } from '~/styles'

import { PlanDetailsTabsOptionsEnum } from './PlanDetails'

gql`
  fragment PlanItem on Plan {
    id
    name
    code
    chargesCount
    activeSubscriptionsCount
    createdAt
    ...DeletePlanDialog
  }

  query plans($page: Int, $limit: Int, $searchTerm: String) {
    plans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...PlanItem
      }
    }
  }

  ${DeletePlanDialogFragmentDoc}
`

const PlansList = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const deleteDialogRef = useRef<DeletePlanDialogRef>(null)
  const [getPlans, { data, error, loading, fetchMore, variables }] = usePlansLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getPlans, loading)
  const list = data?.plans?.collection || []
  const shouldShowItemActions = hasPermissions(['plansCreate', 'plansUpdate', 'plansDelete'])

  return (
    <>
      <Header withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62442e40cea25600b0b6d84a')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63bee1cc88d85f04deb0d63c')}
          />
          {hasPermissions(['plansCreate']) && (
            <ButtonLink type="button" to={CREATE_PLAN_ROUTE} data-test="create-plan">
              {translate('text_62442e40cea25600b0b6d84c')}
            </ButtonLink>
          )}
        </HeaderRigthBlock>
      </Header>

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = data?.plans?.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <Table
          name="plans-list"
          data={list}
          containerSize={{
            default: 16,
            md: 48,
          }}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(plan) => `${plan.name}`}
          onRowAction={({ id }) =>
            navigate(
              generatePath(PLAN_DETAILS_ROUTE, {
                planId: id,
                tab: PlanDetailsTabsOptionsEnum.overview,
              }),
            )
          }
          columns={[
            {
              key: 'name',
              title: translate('text_62442e40cea25600b0b6d852'),
              maxSpace: true,
              minWidth: 200,
              content: ({ name, code }) => (
                <div>
                  <Typography color="textSecondary" variant="bodyHl" noWrap>
                    {name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {code}
                  </Typography>
                </div>
              ),
            },
            {
              key: 'activeSubscriptionsCount',
              title: translate('text_62d95e42c1e1dfe7376fdf35'),
              minWidth: 112,
              textAlign: 'right',
              content: ({ activeSubscriptionsCount }) => (
                <Typography className="text-right">{activeSubscriptionsCount}</Typography>
              ),
            },
            {
              key: 'chargesCount',
              title: translate('text_62442e40cea25600b0b6d856'),
              minWidth: 80,
              textAlign: 'right',
              content: ({ chargesCount }) => (
                <Typography className="text-right">{chargesCount}</Typography>
              ),
            },
            {
              key: 'createdAt',
              title: translate('text_62442e40cea25600b0b6d858'),
              minWidth: 140,
              textAlign: 'right',
              content: ({ createdAt }) => (
                <Typography variant="body" color="grey600" className="text-right">
                  {formatTimeOrgaTZ(createdAt)}
                </Typography>
              ),
            },
          ]}
          actionColumnTooltip={() => translate('text_64fa1756d7ccc300a03a09f4')}
          actionColumn={(plan) => {
            return shouldShowItemActions
              ? [
                  {
                    startIcon: 'pen',
                    title: translate('text_625fd39a15394c0117e7d792'),
                    dataTest: 'tab-internal-button-link-update-plan',
                    onAction: () =>
                      navigate(
                        generatePath(UPDATE_PLAN_ROUTE, {
                          planId: plan.id,
                        }),
                      ),
                  },
                  {
                    startIcon: 'duplicate',
                    title: translate('text_64fa170e02f348164797a6af'),
                    onAction: () => {
                      updateDuplicatePlanVar({
                        type: 'duplicate',
                        parentId: plan.id,
                      })
                      navigate(CREATE_PLAN_ROUTE)
                    },
                  },
                  {
                    startIcon: 'trash',
                    title: translate('text_625fd39a15394c0117e7d794'),
                    onAction: () => deleteDialogRef.current?.openDialog({ plan }),
                  },
                ]
              : undefined
          }}
          placeholder={{
            errorState: !!variables?.searchTerm
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_624451f920b6a500aab3761a'),
                  subtitle: translate('text_624451f920b6a500aab3761e'),
                  buttonTitle: translate('text_624451f920b6a500aab37622'),
                  buttonVariant: 'primary',
                  buttonAction: () => location.reload(),
                },

            emptyState: !!variables?.searchTerm
              ? {
                  title: translate('text_63bee1cc88d85f04deb0d676'),
                  subtitle: translate('text_63bee1cc88d85f04deb0d67a'),
                }
              : hasPermissions(['plansCreate'])
                ? {
                    title: translate('text_624451f920b6a500aab37618'),
                    subtitle: translate('text_624451f920b6a500aab3761c'),
                    buttonTitle: translate('text_624451f920b6a500aab37620'),
                    buttonVariant: 'primary',
                    buttonAction: () => navigate(CREATE_PLAN_ROUTE),
                  }
                : {
                    title: translate('text_664dea0f9995af014cf66c9a'),
                    subtitle: translate('text_624451f920b6a500aab3761c'),
                  },
          }}
        />
      </InfiniteScroll>

      <DeletePlanDialog ref={deleteDialogRef} />
    </>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

export default PlansList
