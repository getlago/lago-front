import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Typography, Button, InfiniteScroll } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { CustomerItemFragmentDoc, useCustomersLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, PageHeader, ListHeader, ListContainer } from '~/styles'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { AddCustomerDrawer, AddCustomerDrawerRef } from '~/components/customers/AddCustomerDrawer'
import { CustomerItemSkeleton, CustomerItem } from '~/components/customers/CustomerItem'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { SearchInput } from '~/components/SearchInput'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

gql`
  query customers($page: Int, $limit: Int, $searchTerm: String) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...CustomerItem
      }
    }
  }

  ${CustomerItemFragmentDoc}
`

const CustomersList = () => {
  const addCustomerDrawerRef = useRef<AddCustomerDrawerRef>(null)
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `customer-item-${i}`,
  })
  const { translate } = useInternationalization()
  const [getCustomers, { data, error, loading, fetchMore, variables }] = useCustomersLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCustomers, loading)
  const list = data?.customers?.collection || []
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_624efab67eb2570101d117a5')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63befc65efcd9374da45b801')}
          />
          <Button
            data-test="create-customer"
            onClick={() => addCustomerDrawerRef.current?.openDrawer()}
          >
            {translate('text_624efab67eb2570101d117bc')}
          </Button>
        </HeaderRigthBlock>
      </Header>

      <ListContainer>
        <ListHead $withActions>
          <PlanNameSection>
            <Typography color="disabled" variant="bodyHl">
              {translate('text_624efab67eb2570101d117cc')}
            </Typography>
          </PlanNameSection>
          <PlanInfosSection>
            <MediumCell color="disabled" variant="bodyHl">
              {translate('text_62d95e42c1e1dfe7376fdf35')}
            </MediumCell>
            <SmallCell color="disabled" variant="bodyHl">
              {translate('text_624efab67eb2570101d117e3')}
            </SmallCell>
          </PlanInfosSection>
        </ListHead>
        {!!isLoading && variables?.searchTerm ? (
          <>
            {[0, 1, 2].map((i) => (
              <CustomerItemSkeleton key={`customer-item-skeleton-${i}`} />
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
                title={translate('text_624efab67eb2570101d117d0')}
                subtitle={translate('text_624efab67eb2570101d117d8')}
                buttonTitle={translate('text_624efab67eb2570101d117e0')}
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
                title={translate('text_63befc65efcd9374da45b813')}
                subtitle={translate('text_63befc65efcd9374da45b817')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_624efab67eb2570101d117a9')}
                subtitle={translate('text_624efab67eb2570101d117af')}
                buttonTitle={translate('text_624efab67eb2570101d117b9')}
                buttonVariant="primary"
                buttonAction={() => addCustomerDrawerRef.current?.openDrawer()}
                image={<EmptyImage width="136" height="104" />}
              />
            )}
          </>
        ) : (
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.customers?.metadata || {}

              currentPage < totalPages &&
                !isLoading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            <>
              {!!list &&
                list.map((customer) => {
                  index += 1

                  return (
                    <CustomerItem
                      key={customer.id}
                      rowId={`customer-item-${index}`}
                      customer={customer}
                    />
                  )
                })}
              {isLoading &&
                [0, 1, 2].map((i) => <CustomerItemSkeleton key={`customer-item-skeleton-${i}`} />)}
            </>
          </InfiniteScroll>
        )}
      </ListContainer>

      <AddCustomerDrawer ref={addCustomerDrawerRef} />
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

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const ListHead = styled(ListHeader)`
  justify-content: space-between;
`

const MediumCell = styled(Typography)`
  text-align: right;
  width: 140px;
`

const SmallCell = styled(Typography)<{ $alignLeft?: boolean }>`
  text-align: ${({ $alignLeft }) => ($alignLeft ? 'left' : 'right')};
  width: 112px;
`

const PlanNameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
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

export default CustomersList
