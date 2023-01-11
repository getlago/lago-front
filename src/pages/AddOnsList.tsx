import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate, generatePath } from 'react-router-dom'

import { CREATE_ADD_ON_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import { Typography, ButtonLink, InfiniteScroll } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { AddOnItem, AddOnItemSkeleton } from '~/components/addOns/AddOnItem'
import { AddOnItemFragmentDoc, useAddOnsLazyQuery } from '~/generated/graphql'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { SearchInput } from '~/components/SearchInput'

gql`
  query addOns($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
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
  const [getAddOns, { data, error, loading, fetchMore, variables }] = useAddOnsLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const { debouncedSearch, isSearchLoading } = useDebouncedSearch(getAddOns, loading)
  const isLoading = isSearchLoading || loading
  const list = data?.addOns?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_629728388c4d2300e2d3809b')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63bee4e10e2d53912bfe4db8')}
          />
          <ButtonLink type="button" to={CREATE_ADD_ON_ROUTE}>
            {translate('text_629728388c4d2300e2d38085')}
          </ButtonLink>
        </HeaderRigthBlock>
      </Header>

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
        {!!isLoading && variables?.searchTerm ? (
          <>
            {[0, 1, 2].map((i) => (
              <AddOnItemSkeleton key={`plan-item-skeleton-${i}`} />
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
                title={translate('text_629728388c4d2300e2d380d5')}
                subtitle={translate('text_629728388c4d2300e2d380eb')}
                buttonTitle={translate('text_629728388c4d2300e2d38110')}
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
                title={translate('text_63bee4e10e2d53912bfe4da5')}
                subtitle={translate('text_63bee4e10e2d53912bfe4da7')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_629728388c4d2300e2d380c9')}
                subtitle={translate('text_629728388c4d2300e2d380df')}
                buttonTitle={translate('text_629728388c4d2300e2d3810f')}
                buttonVariant="primary"
                buttonAction={() => navigate(CREATE_ADD_ON_ROUTE)}
                image={<EmptyImage width="136" height="104" />}
              />
            )}
          </>
        ) : (
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.addOns?.metadata || {}

              currentPage < totalPages &&
                !isLoading &&
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
              {isLoading &&
                [0, 1, 2].map((i) => <AddOnItemSkeleton key={`plan-item-skeleton-${i}`} />)}
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

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

export default AddOnsList
