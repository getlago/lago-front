import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'

import { Typography, InfiniteScroll } from '~/components/designSystem'
import {
  PortalInvoiceListItemFragmentDoc,
  useCustomerPortalInvoicesLazyQuery,
} from '~/generated/graphql'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { SearchInput } from '~/components/SearchInput'

import {
  PortalInvoiceListItem,
  PortalInvoiceListItemGridTemplate,
  PortalInvoiceListItemSkeleton,
} from './PortalInvoiceListItem'

gql`
  query customerPortalInvoices($limit: Int, $page: Int, $searchTerm: String) {
    customerPortalInvoices(limit: $limit, page: $page, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...PortalInvoiceListItem
      }
    }
  }

  ${PortalInvoiceListItemFragmentDoc}
`

interface PortalCustomerInvoicesProps {
  translate: Function
  documentLocale: string
}

export const PortalInvoicesList = ({ translate, documentLocale }: PortalCustomerInvoicesProps) => {
  const [getInvoices, { data, loading, error, fetchMore, variables }] =
    useCustomerPortalInvoicesLazyQuery({
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      variables: {
        limit: 20,
      },
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getInvoices, loading)
  const { metadata, collection } = data?.customerPortalInvoices || {}
  const hasSearchTerm = !!variables?.searchTerm
  const hasNoInvoices = !loading && !error && !metadata?.totalCount && !hasSearchTerm

  return (
    <section role="grid" tabIndex={-1}>
      <PageHeader $isEmpty={hasNoInvoices}>
        <Typography variant="subhead" color="grey700">
          {translate('text_6419c64eace749372fc72b37')}
        </Typography>

        {!hasNoInvoices && (
          <HeaderRigthBlock>
            <SearchInput
              onChange={debouncedSearch}
              placeholder={translate('text_6419c64eace749372fc72b33')}
            />
          </HeaderRigthBlock>
        )}
      </PageHeader>
      {hasNoInvoices ? (
        <Typography>{translate('text_6419c64eace749372fc72b3b')}</Typography>
      ) : (
        <ScrollWrapper>
          <ListWrapper>
            <HeaderLine>
              <Typography variant="bodyHl" color="grey500" noWrap>
                {translate('text_6419c64eace749372fc72b39')}
              </Typography>
              <Typography variant="bodyHl" color="grey500" noWrap>
                {translate('text_6419c64eace749372fc72b3c')}
              </Typography>
              <Typography variant="bodyHl" color="grey500" align="right" noWrap>
                {translate('text_6419c64eace749372fc72b3e')}
              </Typography>
              <Typography variant="bodyHl" color="disabled">
                {translate('text_6419c64eace749372fc72b40')}
              </Typography>
            </HeaderLine>
            {isLoading && hasSearchTerm ? (
              <>
                {[0, 1, 2].map((i) => (
                  <PortalInvoiceListItemSkeleton
                    key={`invoice-item-skeleton-${i}`}
                    className={i === 2 ? 'last-invoice-item--no-border' : undefined}
                  />
                ))}
              </>
            ) : !isLoading && !!error ? (
              <StyledGenericPlaceholder
                noMargins
                title={translate('text_641d6ae1d947c400671e6abb')}
                subtitle={translate('text_641d6aee014c8d00c1425cdd')}
                buttonTitle={translate('text_641d6b00ef96c1008754734d')}
                buttonVariant="primary"
                buttonAction={() => location.reload()}
                image={<ErrorImage width="136" height="104" />}
              />
            ) : !isLoading && !collection?.length ? (
              <StyledGenericPlaceholder
                noMargins
                title={translate('text_641d6b0c5a725b00af12bd76')}
                subtitle={translate('text_641d6b1ae9019c00b59fe250')}
                image={<EmptyImage width="136" height="104" />}
              />
            ) : (
              <InfiniteScroll
                onBottom={() => {
                  if (!fetchMore) return
                  const { currentPage = 0, totalPages = 0 } = metadata || {}

                  currentPage < totalPages &&
                    !isLoading &&
                    fetchMore({
                      variables: { page: currentPage + 1 },
                    })
                }}
              >
                {!!collection &&
                  collection.map((invoice, i) => {
                    return (
                      <PortalInvoiceListItem
                        className={
                          !isLoading && collection.length - 1 === i
                            ? 'last-invoice-item--no-border'
                            : undefined
                        }
                        key={`portal-invoice-list-item-${invoice.id}`}
                        invoice={invoice}
                        translate={translate}
                        documentLocale={documentLocale}
                      />
                    )
                  })}
                {isLoading &&
                  [0, 1, 2].map((_, i) => (
                    <PortalInvoiceListItemSkeleton
                      key={`invoice-item-skeleton-${i}`}
                      className={i === 2 ? 'last-invoice-item--no-border' : undefined}
                    />
                  ))}
              </InfiniteScroll>
            )}
          </ListWrapper>
        </ScrollWrapper>
      )}
    </section>
  )
}

export default PortalInvoicesList

const PageHeader = styled.div<{ $isEmpty?: boolean }>`
  align-items: center;
  display: flex;
  height: ${NAV_HEIGHT}px;
  justify-content: space-between;
  ${({ $isEmpty }) =>
    !!$isEmpty &&
    css`
      box-shadow: ${theme.shadows[7]};
      margin-bottom: ${theme.spacing(6)};
    `};
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;
`

const HeaderLine = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: grid;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  border-radius: 12px 12px 0 0;
  ${PortalInvoiceListItemGridTemplate()}
  padding: 0 ${theme.spacing(4)};
`

const StyledGenericPlaceholder = styled(GenericPlaceholder)`
  margin: ${theme.spacing(6)} auto;
  text-align: center;
`

const ListWrapper = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
  min-width: 510px;

  .last-invoice-item--no-border {
    box-shadow: none;
    border-radius: 0 0 12px 12px;
  }
`

const ScrollWrapper = styled.div`
  overflow: auto;
`
