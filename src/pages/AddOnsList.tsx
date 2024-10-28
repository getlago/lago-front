import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { AddOnItem, AddOnItemSkeleton } from '~/components/addOns/AddOnItem'
import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'
import { ButtonLink, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { SearchInput } from '~/components/SearchInput'
import { CREATE_ADD_ON_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { AddOnItemFragmentDoc, useAddOnsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, PageHeader, theme } from '~/styles'

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
  const { hasPermissions } = usePermissions()
  const deleteDialogRef = useRef<DeleteAddOnDialogRef>(null)
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `add-on-item-${i}`,
    navigate: (id) => navigate(generatePath(UPDATE_ADD_ON_ROUTE, { addOnId: String(id) })),
  })
  const [getAddOns, { data, error, loading, fetchMore, variables }] = useAddOnsLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getAddOns, loading)
  const list = data?.addOns?.collection || []
  let index = -1
  const shouldShowItemActions = hasPermissions(['addonsCreate', 'addonsUpdate', 'addonsDelete'])

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
          {hasPermissions(['addonsCreate']) && (
            <ButtonLink type="button" to={CREATE_ADD_ON_ROUTE} data-test="create-addon-cta">
              {translate('text_629728388c4d2300e2d38085')}
            </ButtonLink>
          )}
        </HeaderRigthBlock>
      </Header>

      <ListContainer>
        <ListHead $withActions={shouldShowItemActions}>
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
            ) : hasPermissions(['addonsCreate']) ? (
              <GenericPlaceholder
                title={translate('text_629728388c4d2300e2d380c9')}
                subtitle={translate('text_629728388c4d2300e2d380df')}
                buttonTitle={translate('text_629728388c4d2300e2d3810f')}
                buttonVariant="primary"
                buttonAction={() => navigate(CREATE_ADD_ON_ROUTE)}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_664de6f0ec798e005a110d19')}
                subtitle={translate('text_629728388c4d2300e2d380df')}
                image={<EmptyImage width="136" height="104" />}
              />
            )}
          </>
        ) : (
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 1, totalPages = 0 } = data?.addOns?.metadata || {}

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
                      deleteDialogRef={deleteDialogRef}
                      shouldShowItemActions={shouldShowItemActions}
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

      <DeleteAddOnDialog ref={deleteDialogRef} />
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
