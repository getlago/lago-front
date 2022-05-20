import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { CREATE_COUPON_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { Typography, Button, InfiniteScroll } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'
import EmojiEmpty from '~/public/images/spider-web.png'
import { CouponItem, CouponItemSkeleton } from '~/components/coupons/CouponItem'
import { CouponItemFragmentDoc, useCouponsQuery } from '~/generated/graphql'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'

gql`
  query coupons($page: Int, $limit: Int) {
    coupons(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CouponItem
      }
    }
  }

  ${CouponItemFragmentDoc}
`

const CouponsList = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `coupon-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_COUPON_ROUTE, { id: String(id) })),
  })
  const { data, error, loading, fetchMore } = useCouponsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const list = data?.coupons?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62865498824cc10126ab2956')}
        </Typography>
        <Button onClick={() => navigate(CREATE_COUPON_ROUTE)}>
          {translate('text_62865498824cc10126ab2954')}
        </Button>
      </Header>

      {!loading && !!error ? (
        <GenericPlaceholder
          title={translate('text_62865498824cc10126ab2962')}
          subtitle={translate('text_62865498824cc10126ab2968')}
          buttonTitle={translate('text_62865498824cc10126ab296e')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : !loading && (!list || !list.length) ? (
        <GenericPlaceholder
          title={translate('text_62865498824cc10126ab296c')}
          subtitle={translate('text_62865498824cc10126ab2971')}
          buttonTitle={translate('text_62865498824cc10126ab2975')}
          buttonVariant="primary"
          buttonAction={() => {
            /** TODO */
          }}
          image={<img src={EmojiEmpty} alt="empty-emoji" />}
        />
      ) : (
        <ListContainer>
          <ListHead $withActions>
            <CouponSection>
              <Typography color="disabled" variant="bodyHl">
                {translate('text_62865498824cc10126ab2960')}
              </Typography>
            </CouponSection>
            <CouponInfosSection>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_62865498824cc10126ab2964')}
              </SmallCell>
              <SmallCell color="disabled" variant="bodyHl">
                {translate('text_62865498824cc10126ab296a')}
              </SmallCell>
              <MediumCell color="disabled" variant="bodyHl">
                {translate('text_62865498824cc10126ab296f')}
              </MediumCell>
            </CouponInfosSection>
          </ListHead>
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.coupons?.metadata || {}

              currentPage < totalPages &&
                !loading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            <>
              {!!list &&
                list.map((coupon) => {
                  index += 1

                  return (
                    <CouponItem
                      key={coupon.id}
                      coupon={coupon}
                      navigationProps={{
                        id: `coupon-item-${index}`,
                        'data-id': coupon.id,
                      }}
                    />
                  )
                })}
              {loading &&
                [0, 1, 2].map((i) => <CouponItemSkeleton key={`plan-item-skeleton-${i}`} />)}
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

const CouponSection = styled.div`
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

export default CouponsList
