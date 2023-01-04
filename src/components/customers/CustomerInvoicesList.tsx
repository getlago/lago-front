import { gql, FetchMoreQueryOptions } from '@apollo/client'
import styled from 'styled-components'

import {
  TimezoneEnum,
  InvoiceForInvoiceListFragment,
  InvoiceListItemFragmentDoc,
} from '~/generated/graphql'
import { Typography, Tooltip, InfiniteScroll, Button } from '~/components/designSystem'
import { theme, HEADER_TABLE_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { getTimezoneConfig } from '~/core/timezone'
import {
  InvoiceListItemSkeleton,
  InvoiceListItem,
  InvoiceListItemGridTemplate,
  InvoiceListItemContextEnum,
} from '~/components/invoices/InvoiceListItem'

gql`
  fragment InvoiceForInvoiceList on InvoiceCollection {
    collection {
      id
      customer {
        id
        applicableTimezone
      }
      ...InvoiceListItem
    }
    metadata {
      currentPage
      totalCount
      totalPages
    }
  }

  ${InvoiceListItemFragmentDoc}
`

enum CustomerInvoiceListContextEnum {
  draft = 'draft',
  finalized = 'finalized',
}

interface InvoiceListProps {
  loading: boolean
  customerTimezone: TimezoneEnum
  invoiceData?: InvoiceForInvoiceListFragment
  displayItemLimit?: number
  context?: keyof typeof CustomerInvoiceListContextEnum
  getOnClickLink: (id: string) => string
  onSeeAll?: () => void
  fetchMore?: (options: FetchMoreQueryOptions<{ page: number }>) => Promise<unknown>
}

export const CustomerInvoicesList = ({
  loading,
  invoiceData,
  customerTimezone,
  context = CustomerInvoiceListContextEnum.draft,
  getOnClickLink,
  onSeeAll,
  fetchMore,
}: InvoiceListProps) => {
  const { metadata, collection } = invoiceData || {}
  const { translate } = useInternationalization()

  return (
    <ScrollWrapper>
      <ListWrapper>
        <HeaderLine>
          <Typography variant="bodyHl" color="grey500" noWrap>
            {translate(
              context === CustomerInvoiceListContextEnum.draft
                ? 'text_63ac86d797f728a87b2f9fa7'
                : 'text_63b5d225b075850e0fe489f4'
            )}
          </Typography>
          <Typography variant="bodyHl" color="grey500" noWrap>
            {translate('text_63ac86d797f728a87b2f9fad')}
          </Typography>

          <Typography variant="bodyHl" color="grey500" align="right" noWrap>
            {translate('text_63ac86d797f728a87b2f9fb9')}
          </Typography>
          <Tooltip
            placement="top-start"
            title={translate('text_6390ea10cf97ec5780001c9d', {
              offset: getTimezoneConfig(customerTimezone).offset,
            })}
          >
            <WithTooltip variant="bodyHl" color="disabled">
              {translate('text_62544c1db13ca10187214d7f')}
            </WithTooltip>
          </Tooltip>
        </HeaderLine>
        <InfiniteScroll
          onBottom={() => {
            if (!fetchMore) return
            const { currentPage = 0, totalPages = 0 } = metadata || {}

            currentPage < totalPages &&
              !loading &&
              fetchMore({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          {collection &&
            collection.map((invoice, i) => {
              const link = getOnClickLink(invoice?.id)

              return (
                <InvoiceListItem
                  className={
                    !loading && !onSeeAll && collection.length - 1 === i
                      ? 'last-invoice-item--no-border'
                      : undefined
                  }
                  key={invoice?.id}
                  to={link}
                  invoice={invoice}
                  context="customer"
                />
              )
            })}
          {loading &&
            [0, 1, 2].map((_, i) => (
              <InvoiceListItemSkeleton
                key={`invoice-item-skeleton-${i}`}
                className={i === 2 ? 'last-invoice-item--no-border' : undefined}
                context="customer"
              />
            ))}
        </InfiniteScroll>
        {!!onSeeAll && (
          <PlusButtonWrapper>
            <Button variant="quaternary" endIcon="arrow-right" onClick={onSeeAll}>
              {translate('text_638f4d756d899445f18a4a0e')}
            </Button>
          </PlusButtonWrapper>
        )}
      </ListWrapper>
    </ScrollWrapper>
  )
}

const HeaderLine = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  background-color: ${theme.palette.common.white};
  border-radius: 12px 12px 0 0;
  padding: 0 ${theme.spacing(4)};
  ${InvoiceListItemGridTemplate(InvoiceListItemContextEnum.customer)}
`

const WithTooltip = styled(Typography)`
  border-bottom: 2px dotted ${theme.palette.grey[400]};
  width: fit-content;
  margin-top: 2px;
  float: right;
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
  overflow: scroll;
`

const PlusButtonWrapper = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`
