import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { CREATE_COUPON_ROUTE, UPDATE_COUPON_ROUTE } from '~/core/router'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { Typography, ButtonLink, InfiniteScroll } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { CouponItem, CouponItemSkeleton } from '~/components/coupons/CouponItem'
import {
  CouponItemFragmentDoc,
  CouponCaptionFragmentDoc,
  useCouponsLazyQuery,
} from '~/generated/graphql'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { SearchInput } from '~/components/SearchInput'

gql`
  query coupons($page: Int, $limit: Int, $searchTerm: String) {
    coupons(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CouponItem
        ...CouponCaption
      }
    }
  }

  ${CouponItemFragmentDoc}
  ${CouponCaptionFragmentDoc}
`

const CouponsList = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `coupon-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_COUPON_ROUTE, { id: String(id) })),
  })
  const [getCoupons, { data, error, loading, fetchMore, variables }] = useCouponsLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCoupons, loading)
  const list = data?.coupons?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_62865498824cc10126ab2956')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63beebbf4f60e2f553232782')}
          />
          <ButtonLink type="button" to={CREATE_COUPON_ROUTE} data-test="add-coupon">
            {translate('text_62865498824cc10126ab2954')}
          </ButtonLink>
        </HeaderRigthBlock>
      </Header>

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
            <MediumCell color="disabled" variant="bodyHl">
              {translate('text_62865498824cc10126ab296a')}
            </MediumCell>
            <MediumCell color="disabled" variant="bodyHl">
              {translate('text_62865498824cc10126ab296f')}
            </MediumCell>
          </CouponInfosSection>
        </ListHead>
        {!!isLoading && variables?.searchTerm ? (
          <>
            {[0, 1, 2].map((i) => (
              <CouponItemSkeleton key={`plan-item-skeleton-${i}`} />
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
                title={translate('text_62865498824cc10126ab2962')}
                subtitle={translate('text_62865498824cc10126ab2968')}
                buttonTitle={translate('text_62865498824cc10126ab296e')}
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
                title={translate('text_63beebbf4f60e2f553232773')}
                subtitle={translate('text_63beebbf4f60e2f553232775')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_62865498824cc10126ab296c')}
                subtitle={translate('text_62865498824cc10126ab2971')}
                buttonTitle={translate('text_62865498824cc10126ab2975')}
                buttonVariant="primary"
                buttonAction={() => navigate(CREATE_COUPON_ROUTE)}
                image={<EmptyImage width="136" height="104" />}
              />
            )}
          </>
        ) : (
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.coupons?.metadata || {}

              currentPage < totalPages &&
                !isLoading &&
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
              {isLoading &&
                [0, 1, 2].map((i) => <CouponItemSkeleton key={`plan-item-skeleton-${i}`} />)}
            </>
          </InfiniteScroll>
        )}
      </ListContainer>
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

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

export default CouponsList
