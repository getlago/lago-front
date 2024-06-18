import { ApolloError, LazyQueryHookOptions } from '@apollo/client'
import { useEffect, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Button, InfiniteScroll, Typography } from '~/components/designSystem'
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
import { InvoiceListStatusEnum } from '~/pages/InvoicesPage'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, NAV_HEIGHT, palette, theme } from '~/styles'

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
      <TabSwitchContainer>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.all}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.all}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_63ac86d797f728a87b2f9f8b')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.draft}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.draft}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_63ac86d797f728a87b2f9f91')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.outstanding}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.outstanding}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_666c5b12fea4aa1e1b26bf52')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.overdue}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.overdue}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_666c5b12fea4aa1e1b26bf55')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.succeeded}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.succeeded}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_63ac86d797f728a87b2f9fa1')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.voided}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.voided}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_6376641a2a9c70fff5bddcd5')}
          </Typography>
        </InvoiceTypeSwitch>
        <InvoiceTypeSwitch
          variant="tertiary"
          align="left"
          $isSelected={invoiceType === InvoiceListStatusEnum.disputed}
          onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.disputed}` })}
        >
          <Typography variant="captionHl" color="grey600">
            {translate('text_66141e30699a0631f0b2ed32')}
          </Typography>
        </InvoiceTypeSwitch>
      </TabSwitchContainer>
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

const TabSwitchContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  padding: ${theme.spacing(4)} ${theme.spacing(12)};
  box-sizing: border-box;
  gap: ${theme.spacing(3)};
  box-shadow: ${theme.shadows[7]};
  overflow-y: scroll;

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(4)};
  }
`

const InvoiceTypeSwitch = styled(Button)<{ $isSelected: boolean }>`
  flex-grow: 1;
  height: 44px;

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      color: ${palette.primary.main};

      > div {
        color: ${palette.primary.main};
      }
    `};

  ${theme.breakpoints.down('md')} {
    width: fit-content;
    flex-grow: 0;
  }
`
