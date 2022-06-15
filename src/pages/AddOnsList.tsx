import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { CREATE_ADD_ON_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { Typography, Button, InfiniteScroll } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import { AddOnItem, AddOnItemSkeleton } from '~/components/addOns/AddOnItem'
import { AddOnItemFragmentDoc, useAddOnsQuery } from '~/generated/graphql'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query addOns($page: Int, $limit: Int) {
    addOns(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...AddOnItem
      }
    }
  }

  ${AddOnItemFragmentDoc}
`

const AddOnsList = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `add-on-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_ADD_ON_ROUTE, { id: String(id) })),
  })
  const { data, error, loading, fetchMore } = useAddOnsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const list = data?.addOns?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_629728388c4d2300e2d3809b')}
        </Typography>
        <Button onClick={() => navigate(CREATE_ADD_ON_ROUTE)}>
          {translate('text_629728388c4d2300e2d38085')}
        </Button>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_629728388c4d2300e2d380d5')}
          subtitle={translate('text_629728388c4d2300e2d380eb')}
          buttonTitle={translate('text_629728388c4d2300e2d38110')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_629728388c4d2300e2d380c9')}
          subtitle={translate('text_629728388c4d2300e2d380df')}
          buttonTitle={translate('text_629728388c4d2300e2d3810f')}
          buttonVariant="primary"
          buttonAction={() => navigate(CREATE_ADD_ON_ROUTE)}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <ListContainer>
          <ListHead $withActions>
            <NameSection>
              <Typography color="disabled" variant="bodyHl">
                {translate('text_629728388c4d2300e2d380bd')}
              </Typography>
            </NameSection>
            <CouponInfosSection>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_629728388c4d2300e2d380cd')}
              </SmallCell>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_629728388c4d2300e2d380e3')}
              </MediumCell>
            </CouponInfosSection>
          </ListHead>
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.addOns?.metadata || {}

              currentPage < totalPages &&
                !loading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            <>
              {!!list &&
                list.map((addOn) => {
                  index += 1

                  return (
                    <AddOnItem
                      key={addOn.id}
                      addOn={addOn}
                      navigationProps={{
                        id: `add-on-item-${index}`,
                        'data-id': addOn.id,
                      }}
                    />
                  )
                })}
              {loading &&
                [0, 1, 2].map((i) => <AddOnItemSkeleton key={`plan-item-skeleton-${i}`} />)}
            </>
          </InfiniteScroll>
        </ListContainer>
      )}
    </div>
  )
}

const ListHead = styled(ListHeader)`
  justify-content: space-between;
`

const NameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
`

const CouponInfosSection = styled.div`
  display: flex;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};

    ${theme.breakpoints.down('md')} {
      display: none;
    }
  }
`

const MediumCell = styled(Typography)`
  width: 112px;
`

const SmallCell = styled(Typography)`
  text-align: right;
  width: 96px;
`

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

export default AddOnsList
