import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { Typography, Button } from '~/components/designSystem'
import { CREATE_PLAN_ROUTE, UPDATE_PLAN_ROUTE } from '~/core/router'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { usePlansQuery, PlanItemFragmentDoc } from '~/generated/graphql'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import { PlanItem, PlanItemSkeleton } from '~/components/plans/PlanItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query plans($page: Int, $limit: Int) {
    plans(page: $page, limit: $limit) {
      collection {
        ...PlanItem
      }
    }
  }

  ${PlanItemFragmentDoc}
`

const PlansList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { data, error, loading } = usePlansQuery()
  const list = data?.plans?.collection || []
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `plan-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_PLAN_ROUTE, { id: String(id) })),
  })
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62442e40cea25600b0b6d84a')}
        </Typography>
        <Button onClick={() => navigate(CREATE_PLAN_ROUTE)}>
          {translate('text_62442e40cea25600b0b6d84c')}
        </Button>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_624451f920b6a500aab3761a')}
          subtitle={translate('text_624451f920b6a500aab3761e')}
          buttonTitle={translate('text_624451f920b6a500aab37622')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_624451f920b6a500aab37618')}
          subtitle={translate('text_624451f920b6a500aab3761c')}
          buttonTitle={translate('text_624451f920b6a500aab37620')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_PLAN_ROUTE)}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <ListContainer>
          <ListHead $withActions>
            <PlanNameSection>
              <Typography color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d852')}
              </Typography>
            </PlanNameSection>
            <PlanInfosSection>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d854')}
              </MediumCell>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d856')}
              </SmallCell>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_62442e40cea25600b0b6d858')}
              </MediumCell>
            </PlanInfosSection>
          </ListHead>
          {loading
            ? [0, 1, 2].map((i) => <PlanItemSkeleton key={`plan-item-skeleton-${i}`} />)
            : list.map((plan) => {
                index += 1

                return (
                  <PlanItem
                    key={plan.id}
                    plan={plan}
                    navigationProps={{
                      id: `plan-item-${index}`,
                      'data-id': plan.id,
                    }}
                  />
                )
              })}
        </ListContainer>
      )}
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

const MediumCell = styled(Typography)`
  text-align: right;
  width: 112px;
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
