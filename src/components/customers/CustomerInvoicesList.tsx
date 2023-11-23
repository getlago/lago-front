import { FetchMoreQueryOptions, gql } from '@apollo/client'
import { useRef } from 'react'
import styled from 'styled-components'

import { Button, InfiniteScroll, Tooltip, Typography } from '~/components/designSystem'
import {
  InvoiceListItem,
  InvoiceListItemContextEnum,
  InvoiceListItemGridTemplate,
  InvoiceListItemSkeleton,
} from '~/components/invoices/InvoiceListItem'
import { getTimezoneConfig } from '~/core/timezone'
import {
  InvoiceForInvoiceListFragment,
  InvoiceListItemFragmentDoc,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'

import { GenericPlaceholder } from '../GenericPlaceholder'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '../invoices/EditInvoicePaymentStatusDialog'
import { FinalizeInvoiceDialog, FinalizeInvoiceDialogRef } from '../invoices/FinalizeInvoiceDialog'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '../invoices/VoidInvoiceDialog'

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
  isLoading: boolean
  hasError?: boolean
  hasSearchTerm?: boolean
  customerTimezone?: TimezoneEnum
  invoiceData?: InvoiceForInvoiceListFragment
  context?: keyof typeof CustomerInvoiceListContextEnum
  getOnClickLink: (id: string) => string
  onSeeAll?: () => void
  fetchMore?: (options: FetchMoreQueryOptions<{ page: number }>) => Promise<unknown>
}

export const CustomerInvoicesList = ({
  isLoading,
  hasError = false,
  hasSearchTerm = false,
  invoiceData,
  customerTimezone = TimezoneEnum.TzUtc,
  context = CustomerInvoiceListContextEnum.draft,
  getOnClickLink,
  onSeeAll,
  fetchMore,
}: InvoiceListProps) => {
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
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
                : 'text_63b5d225b075850e0fe489f4',
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
        {isLoading && hasSearchTerm ? (
          <>
            {[0, 1, 2].map((i) => (
              <InvoiceListItemSkeleton
                key={`invoice-item-skeleton-${i}`}
                className={i === 2 ? 'last-invoice-item--no-border' : undefined}
                context="customer"
              />
            ))}
          </>
        ) : !isLoading && hasError ? (
          <StyledGenericPlaceholder
            noMargins
            title={translate('text_634812d6f16b31ce5cbf4111')}
            subtitle={translate('text_634812d6f16b31ce5cbf411f')}
            buttonTitle={translate('text_634812d6f16b31ce5cbf4123')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : !isLoading && !collection?.length ? (
          <StyledGenericPlaceholder
            noMargins
            title={translate('text_63c6cac5c1fc58028d0235eb')}
            subtitle={translate('text_63c6cac5c1fc58028d0235ef')}
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
                const link = getOnClickLink(invoice?.id)

                return (
                  <InvoiceListItem
                    className={
                      !isLoading && !onSeeAll && collection.length - 1 === i
                        ? 'last-invoice-item--no-border'
                        : undefined
                    }
                    key={invoice?.id}
                    to={link}
                    invoice={invoice}
                    context="customer"
                    finalizeInvoiceRef={finalizeInvoiceRef}
                    updateInvoicePaymentStatusDialog={updateInvoicePaymentStatusDialog}
                    voidInvoiceDialogRef={voidInvoiceDialogRef}
                    data-test={`invoice-list-item-${i}`}
                  />
                )
              })}
            {isLoading &&
              [0, 1, 2].map((_, i) => (
                <InvoiceListItemSkeleton
                  key={`invoice-item-skeleton-${i}`}
                  className={i === 2 ? 'last-invoice-item--no-border' : undefined}
                  context="customer"
                />
              ))}
          </InfiniteScroll>
        )}
        {!!onSeeAll && (
          <PlusButtonWrapper>
            <Button variant="quaternary" endIcon="arrow-right" onClick={onSeeAll}>
              {translate('text_638f4d756d899445f18a4a0e')}
            </Button>
          </PlusButtonWrapper>
        )}
      </ListWrapper>

      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
      <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
      <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
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

const PlusButtonWrapper = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`
