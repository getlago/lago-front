import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { Stack } from '@mui/material'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Filters, InfiniteScroll, QuickFilters, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  UpdateInvoicePaymentStatusDialog,
  UpdateInvoicePaymentStatusDialogRef,
} from '~/components/invoices/EditInvoicePaymentStatusDialog'
import {
  FinalizeInvoiceDialog,
  FinalizeInvoiceDialogRef,
} from '~/components/invoices/FinalizeInvoiceDialog'
import {
  InvoiceListItem,
  InvoiceListItemContextEnum,
  InvoiceListItemGridTemplate,
  InvoiceListItemSkeleton,
} from '~/components/invoices/InvoiceListItem'
import { VoidInvoiceDialog, VoidInvoiceDialogRef } from '~/components/invoices/VoidInvoiceDialog'
import { CUSTOMER_INVOICE_DETAILS_ROUTE, INVOICE_SETTINGS_ROUTE } from '~/core/router'
import { GetInvoicesListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, NAV_HEIGHT, theme } from '~/styles'

import { InvoiceListStatusEnum } from './types'

import { AvailableQuickFilters } from '../designSystem/Filters/types'

// Needed to be able to pass both ids to the keyboard navigation function
const ID_SPLIT_KEY = '&-%-&'
const NAVIGATION_KEY_BASE = 'invoice-item-'

type TInvoiceListProps = {
  error: ApolloError | undefined
  fetchMore: Function
  invoices: GetInvoicesListQuery['invoices']['collection'] | undefined
  invoiceType: InvoiceListStatusEnum
  isLoading: boolean
  metadata: GetInvoicesListQuery['invoices']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
}

const InvoicesList = ({
  error,
  fetchMore,
  invoices,
  invoiceType,
  isLoading,
  metadata,
  variables,
}: TInvoiceListProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const updateInvoicePaymentStatusDialog = useRef<UpdateInvoicePaymentStatusDialogRef>(null)
  const voidInvoiceDialogRef = useRef<VoidInvoiceDialogRef>(null)
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${NAVIGATION_KEY_BASE}${i}`,
    navigate: (id) => {
      const splitted = String(id).split(ID_SPLIT_KEY)

      navigate(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: splitted[0],
          invoiceId: splitted[1],
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
      )
    },
  })
  const listContainerElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to top of list when switching tabs
    listContainerElementRef?.current?.scrollTo({ top: 0 })
  }, [invoiceType])

  return (
    <>
      <FiltersWrapper>
        <QuickFilters hideBorderBottom type={AvailableQuickFilters.InvoiceStatus} />
        <Filters
          hideBorderBottom
          filters={[
            'status',
            'invoiceType',
            'paymentStatus',
            'currency',
            'issuingDate',
            'customer',
            'dispute',
            'overdue',
          ]}
        />
      </FiltersWrapper>
      <ScrollContainer
        ref={listContainerElementRef}
        role="grid"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <List>
          <GridLine>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_63ac86d797f728a87b2f9fa7')}
            </Typography>
            <Typography variant="bodyHl" color="grey500" noWrap>
              {translate('text_63ac86d797f728a87b2f9fad')}
            </Typography>
            <CustomerName variant="bodyHl" color="grey500" noWrap>
              {translate('text_63ac86d797f728a87b2f9fb3')}
            </CustomerName>
            <Typography variant="bodyHl" color="grey500" align="right">
              {translate('text_63ac86d797f728a87b2f9fb9')}
            </Typography>
            <Typography variant="bodyHl" color="grey500" align="right">
              {translate('text_63ac86d797f728a87b2f9fbf')}
            </Typography>
          </GridLine>
          {!!isLoading && variables?.searchTerm ? (
            <>
              {[0, 1, 2].map((i) => (
                <InvoiceListItemSkeleton
                  key={`invoice-item-skeleton-${i}`}
                  context="organization"
                />
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
                  title={translate('text_63ac86d797f728a87b2f9fea')}
                  subtitle={translate('text_63ac86d797f728a87b2f9ff2')}
                  buttonTitle={translate('text_63ac86d797f728a87b2f9ffa')}
                  buttonVariant="primary"
                  buttonAction={() => location.reload()}
                  image={<ErrorImage width="136" height="104" />}
                />
              )}
            </>
          ) : !isLoading && !invoices?.length ? (
            <>
              {!!variables?.searchTerm ? (
                <GenericPlaceholder
                  title={translate(
                    invoiceType === InvoiceListStatusEnum.succeeded
                      ? 'text_63c67d2913c20b8d7d05c44c'
                      : invoiceType === InvoiceListStatusEnum.draft
                        ? 'text_63c67d2913c20b8d7d05c442'
                        : invoiceType === InvoiceListStatusEnum.outstanding
                          ? 'text_63c67d8796db41749ada51ca'
                          : invoiceType === InvoiceListStatusEnum.voided
                            ? 'text_65269cd46e7ec037a6823fd8'
                            : 'text_63c67d2913c20b8d7d05c43e',
                  )}
                  subtitle={translate('text_63c67d2913c20b8d7d05c446')}
                  image={<EmptyImage width="136" height="104" />}
                />
              ) : (
                <GenericPlaceholder
                  title={translate(
                    invoiceType === InvoiceListStatusEnum.succeeded
                      ? 'text_63b578e959c1366df5d14559'
                      : invoiceType === InvoiceListStatusEnum.draft
                        ? 'text_63b578e959c1366df5d1455b'
                        : invoiceType === InvoiceListStatusEnum.outstanding
                          ? 'text_63b578e959c1366df5d1456e'
                          : invoiceType === InvoiceListStatusEnum.voided
                            ? 'text_65269cd46e7ec037a6823fd6'
                            : invoiceType === InvoiceListStatusEnum.disputed
                              ? 'text_66141e30699a0631f0b2ec7f'
                              : invoiceType === InvoiceListStatusEnum.overdue
                                ? 'text_666c5b12fea4aa1e1b26bf70'
                                : 'text_63b578e959c1366df5d14569',
                  )}
                  subtitle={
                    invoiceType === InvoiceListStatusEnum.succeeded ? (
                      translate('text_63b578e959c1366df5d1455f')
                    ) : invoiceType === InvoiceListStatusEnum.draft ? (
                      <Typography
                        html={translate('text_63b578e959c1366df5d14566', {
                          link: INVOICE_SETTINGS_ROUTE,
                        })}
                      />
                    ) : invoiceType === InvoiceListStatusEnum.outstanding ? (
                      translate('text_63b578e959c1366df5d14570')
                    ) : invoiceType === InvoiceListStatusEnum.voided ? (
                      translate('text_65269cd46e7ec037a6823fda')
                    ) : invoiceType === InvoiceListStatusEnum.disputed ? (
                      translate('text_66141e30699a0631f0b2ec87')
                    ) : invoiceType === InvoiceListStatusEnum.overdue ? (
                      <Typography
                        html={translate('text_666c5b12fea4aa1e1b26bf73', {
                          link: INVOICE_SETTINGS_ROUTE,
                        })}
                      />
                    ) : (
                      translate('text_63b578e959c1366df5d1456d')
                    )
                  }
                  image={<EmptyImage width="136" height="104" />}
                />
              )}
            </>
          ) : (
            <InfiniteScroll
              onBottom={() => {
                const { currentPage = 0, totalPages = 0 } = metadata || {}

                currentPage < totalPages &&
                  !isLoading &&
                  fetchMore({
                    variables: { page: currentPage + 1 },
                  })
              }}
            >
              {invoices?.map((invoice, index) => {
                return (
                  <InvoiceListItem
                    key={invoice.id}
                    context="organization"
                    invoice={invoice}
                    navigationProps={{
                      id: `${NAVIGATION_KEY_BASE}${index}`,
                      'data-id': `${invoice?.customer?.id}${ID_SPLIT_KEY}${invoice.id}`,
                    }}
                    to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                      customerId: invoice?.customer?.id,
                      invoiceId: invoice.id,
                      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                    })}
                    finalizeInvoiceRef={finalizeInvoiceRef}
                    updateInvoicePaymentStatusDialog={updateInvoicePaymentStatusDialog}
                    voidInvoiceDialogRef={voidInvoiceDialogRef}
                  />
                )
              })}
              {isLoading &&
                [0, 1, 2].map((_, i) => (
                  <InvoiceListItemSkeleton
                    key={`invoice-item-skeleton-${i}`}
                    context="organization"
                  />
                ))}
            </InfiniteScroll>
          )}
        </List>

        <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
        <UpdateInvoicePaymentStatusDialog ref={updateInvoicePaymentStatusDialog} />
        <VoidInvoiceDialog ref={voidInvoiceDialogRef} />
      </ScrollContainer>
    </>
  )
}

export default InvoicesList

const ScrollContainer = styled.div`
  overflow: auto;
  height: calc(100vh - ${NAV_HEIGHT * 2}px);
`

const List = styled(ListContainer)`
  min-width: 740px;
  ${theme.breakpoints.down('md')} {
    min-width: 530px;
  }
`

const GridLine = styled(ListHeader)`
  ${InvoiceListItemGridTemplate(InvoiceListItemContextEnum.organization)}
  top: 0;
`

const CustomerName = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const FiltersWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
  box-sizing: border-box;
  gap: ${theme.spacing(3)};

  &:first-child {
    padding-bottom: 0;
  }

  &:last-child {
    padding-top: 0;
  }
`
