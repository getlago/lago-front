import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonLink, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { DeletePlanDialog, DeletePlanDialogRef } from '~/components/plans/DeletePlanDialog'
import { PlanItem, PlanItemSkeleton } from '~/components/plans/PlanItem'
import { SearchInput } from '~/components/SearchInput'
import { CREATE_PLAN_ROUTE, PLAN_DETAILS_ROUTE } from '~/core/router'
import { PlanItemFragmentDoc, usePlansLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, PageHeader, theme } from '~/styles'

import { PlanDetailsTabsOptionsEnum } from './PlanDetails'

gql`
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

  ${PlanItemFragmentDoc}
`

const PlansList = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const deleteDialogRef = useRef<DeletePlanDialogRef>(null)
  const [getPlans, { data, error, loading, fetchMore, variables }] = usePlansLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getPlans, loading)
  const list = data?.plans?.collection || [] || []
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `plan-item-${i}`,
    navigate: (id) =>
      navigate(
        generatePath(PLAN_DETAILS_ROUTE, {
          planId: String(id),
          tab: PlanDetailsTabsOptionsEnum.overview,
        }),
      ),
  })
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62442e40cea25600b0b6d84a')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63bee1cc88d85f04deb0d63c')}
          />
          <ButtonLink type="button" to={CREATE_PLAN_ROUTE} data-test="create-plan">
            {translate('text_62442e40cea25600b0b6d84c')}
          </ButtonLink>
        </HeaderRigthBlock>
      </Header>

      <ListContainer>
        <ListHead $withActions>
          <PlanNameSection>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_62442e40cea25600b0b6d852')}
            </Typography>
          </PlanNameSection>
          <PlanInfosSection>
            <MediumCell color="disabled" variant="bodyHl">
              {translate('text_62d95e42c1e1dfe7376fdf35')}
            </MediumCell>
            <SmallCell color="disabled" variant="bodyHl">
              {translate('text_62442e40cea25600b0b6d856')}
            </SmallCell>
            <MediumCell color="disabled" variant="bodyHl">
              {translate('text_62442e40cea25600b0b6d858')}
            </MediumCell>
          </PlanInfosSection>
        </ListHead>
        {!!isLoading && variables?.searchTerm ? (
          <>
            {[0, 1, 2].map((i) => (
              <PlanItemSkeleton key={`plan-item-skeleton-${i}`} />
            ))}
          </>
        ) : !isLoading && !!error ? (
          <>
            {!!variables?.searchTerm ? (
              <GenericPlaceholder
                title={translate('text_623b53fea66c76017eaebb6e')}
                subtitle={translate('text_63bab307a61c62af497e0599')}
                image={<ErrorImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_624451f920b6a500aab3761a')}
                subtitle={translate('text_624451f920b6a500aab3761e')}
                buttonTitle={translate('text_624451f920b6a500aab37622')}
                buttonVariant="primary"
                buttonAction={() => location.reload()}
                image={<ErrorImage width="136" height="104" />}
              />
            )}
          </>
        ) : !isLoading && (!list || !list.length) ? (
          <>
            {!!variables?.searchTerm ? (
              <GenericPlaceholder
                title={translate('text_63bee1cc88d85f04deb0d676')}
                subtitle={translate('text_63bee1cc88d85f04deb0d67a')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                data-test="empty"
                title={translate('text_624451f920b6a500aab37618')}
                subtitle={translate('text_624451f920b6a500aab3761c')}
                buttonTitle={translate('text_624451f920b6a500aab37620')}
                buttonVariant="primary"
                buttonAction={() => navigate(CREATE_PLAN_ROUTE)}
                image={<EmptyImage width="136" height="104" />}
              />
            )}
          </>
        ) : (
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
            <>
              {!!list &&
                list.map((plan) => {
                  index += 1

                  return (
                    <PlanItem
                      key={plan.id}
                      plan={plan}
                      deleteDialogRef={deleteDialogRef}
                      navigationProps={{
                        id: `plan-item-${index}`,
                        'data-id': plan.id,
                      }}
                    />
                  )
                })}
              {isLoading &&
                [0, 1, 2].map((i) => <PlanItemSkeleton key={`plan-item-skeleton-${i}`} />)}
            </>
          </InfiniteScroll>
        )}
      </ListContainer>

      <DeletePlanDialog ref={deleteDialogRef} />
    </div>
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

const ListHead = styled(ListHeader)`
  justify-content: space-between;
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const MediumCell = styled(Typography)`
  text-align: right;
  width: 118px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 80px;
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const PlanInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

export default PlansList
