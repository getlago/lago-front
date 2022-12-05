import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled, { css } from 'styled-components'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  InvoiceInfosForInvoiceListFragment,
  InvoicePaymentStatusTypeEnum,
  useDownloadInvoiceMutation,
  TimezoneEnum,
  InvoiceStatusTypeEnum,
  InvoiceForFinalizeInvoiceFragmentDoc,
} from '~/generated/graphql'
import {
  Button,
  InfiniteScroll,
  Popper,
  Skeleton,
  Status,
  StatusEnum,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, MenuPopper, NAV_HEIGHT, PopperOpener, theme } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { formatDateToTZ, getTimezoneConfig } from '~/core/timezone'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

import { FinalizeInvoiceDialog, FinalizeInvoiceDialogRef } from '../invoices/FinalizeInvoiceDialog'

gql`
  fragment InvoiceInfosForInvoiceList on InvoiceCollection {
    collection {
      id
      amountCurrency
      issuingDate
      number
      paymentStatus
      status
      totalAmountCents
      ...InvoiceForFinalizeInvoice
    }
    metadata {
      currentPage
      totalCount
      totalPages
    }
  }

  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }

  ${InvoiceForFinalizeInvoiceFragmentDoc}
`

interface InvoicesListProps {
  customerId: string
  itemDisplayLimit?: number
  invoices?: InvoiceInfosForInvoiceListFragment['collection']
  label?: string
  fetchMore?: Function
  loading: boolean
  loadingItemCount?: number
  metadata?: InvoiceInfosForInvoiceListFragment['metadata']
  showPaymentCell?: boolean
  customerTimezone: TimezoneEnum
}

const mapStatus = (type?: InvoicePaymentStatusTypeEnum | undefined) => {
  switch (type) {
    case InvoicePaymentStatusTypeEnum.Succeeded:
      return {
        type: StatusEnum.running,
        label: 'text_638f4d756d899445f18a4a94',
      }
    case InvoicePaymentStatusTypeEnum.Failed:
      return {
        type: StatusEnum.failed,
        label: 'text_638f4d756d899445f18a4a98',
      }
    default:
      return {
        type: StatusEnum.paused,
        label: 'text_638f4d756d899445f18a4a96',
      }
  }
}

export const InvoicesList = ({
  customerId,
  invoices,
  label,
  loading,
  loadingItemCount = 3,
  itemDisplayLimit,
  metadata,
  fetchMore,
  showPaymentCell = false,
  customerTimezone,
}: InvoicesListProps) => {
  let navigate = useNavigate()
  const { translate } = useInternationalization()
  const finalizeInvoiceRef = useRef<FinalizeInvoiceDialogRef>(null)
  const showSeeAllButton =
    (!!metadata && !!itemDisplayLimit && metadata?.totalCount > itemDisplayLimit) || false
  const [downloadInvoice] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: data }) {
      const fileUrl = data?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

  return (
    <Wrapper>
      <Header>
        {loading ? (
          <Skeleton variant="text" height={12} width={224} />
        ) : (
          <>
            {!!label && (
              <Typography variant="subhead" color="grey700">
                {label}
              </Typography>
            )}
          </>
        )}
      </Header>

      <ListWrapper>
        <ListHeader>
          <IssuingDateCell variant="bodyHl" color="disabled" noWrap>
            <Tooltip
              placement="top-start"
              title={translate('text_6390ea10cf97ec5780001c9d', {
                offset: getTimezoneConfig(customerTimezone).offset,
              })}
            >
              <WithTooltip>{translate('text_62544c1db13ca10187214d7f')}</WithTooltip>
            </Tooltip>
          </IssuingDateCell>
          <NumberCellHeader variant="bodyHl" color="disabled">
            {translate('text_62b31e1f6a5b8b1b745ece00')}
          </NumberCellHeader>
          <AmountCell variant="bodyHl" color="disabled" align="right">
            {translate('text_62544c1db13ca10187214d85')}
          </AmountCell>
          {showPaymentCell && <PaymentCell></PaymentCell>}
          <ButtonMock />
        </ListHeader>
        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = metadata || {}

            currentPage < totalPages &&
              !loading &&
              !!fetchMore &&
              fetchMore({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          {invoices?.map((invoice, i) => {
            if (!!itemDisplayLimit && i >= itemDisplayLimit) return

            const {
              amountCurrency,
              id,
              issuingDate,
              number,
              paymentStatus,
              status,
              totalAmountCents,
            } = invoice

            const formattedStatus = mapStatus(paymentStatus)

            return (
              <ItemContainer key={`invoice-${id}`} $hasExtraSeeAllButton={showSeeAllButton}>
                <Item
                  className="item"
                  tabIndex={0}
                  onClick={() =>
                    navigate(
                      generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                        id: customerId,
                        invoiceId: id,
                        tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                      })
                    )
                  }
                >
                  <IssuingDateCell noWrap>
                    {formatDateToTZ(issuingDate, customerTimezone)}
                  </IssuingDateCell>
                  <NumberCell color="textSecondary">{number}</NumberCell>
                  <AmountCell color="textSecondary" align="right">
                    {intlFormatNumber(deserializeAmount(totalAmountCents, amountCurrency), {
                      currency: amountCurrency,
                    })}
                  </AmountCell>
                  {showPaymentCell && (
                    <PaymentCell>
                      <Tooltip placement="top-end" title={translate(formattedStatus.label)}>
                        <Status type={formattedStatus.type} />
                      </Tooltip>
                    </PaymentCell>
                  )}
                  <ButtonMock />
                </Item>
                <Popper
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ isOpen }) => (
                    <DotsOpener>
                      <Tooltip
                        placement="top-end"
                        disableHoverListener={isOpen}
                        title={translate('text_62b31e1f6a5b8b1b745ece3c')}
                      >
                        <Button icon="dots-horizontal" variant="quaternary" />
                      </Tooltip>
                    </DotsOpener>
                  )}
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      {status === InvoiceStatusTypeEnum.Draft ? (
                        <Button
                          startIcon="checkmark"
                          variant="quaternary"
                          align="left"
                          onClick={() => {
                            finalizeInvoiceRef.current?.openDialog(invoice)
                          }}
                        >
                          {translate('text_63a41a8eabb9ae67047c1c08')}
                        </Button>
                      ) : (
                        <Button
                          startIcon="download"
                          variant="quaternary"
                          align="left"
                          onClick={async () => {
                            await downloadInvoice({
                              variables: { input: { id } },
                            })
                          }}
                        >
                          {translate('text_62b31e1f6a5b8b1b745ece42')}
                        </Button>
                      )}
                      <Button
                        startIcon="duplicate"
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          navigator.clipboard.writeText(id)
                          addToast({
                            severity: 'info',
                            translateKey: 'text_6253f11816f710014600ba1f',
                          })
                          closePopper()
                        }}
                      >
                        {translate('text_62b31e1f6a5b8b1b745ece46')}
                      </Button>
                    </MenuPopper>
                  )}
                </Popper>
              </ItemContainer>
            )
          })}
        </InfiniteScroll>
        {loading &&
          Array.from(Array(loadingItemCount).keys()).map((i) => (
            <LoadingItem key={`loading-item-${i}`}>
              <div>
                <Skeleton variant="text" height={12} width={96} />
                <Skeleton variant="text" height={12} width={160} />
              </div>
              <div>
                <Skeleton variant="text" height={12} width={120} />
                <Button disabled={true} icon="dots-horizontal" variant="quaternary" />
              </div>
            </LoadingItem>
          ))}
        {showSeeAllButton && (
          <PlusButtonWrapper>
            <Button
              variant="quaternary"
              endIcon="arrow-right"
              onClick={() => {
                navigate(generatePath(CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, { id: customerId }))
              }}
            >
              {translate('text_638f4d756d899445f18a4a0e')}
            </Button>
          </PlusButtonWrapper>
        )}
      </ListWrapper>
      <FinalizeInvoiceDialog ref={finalizeInvoiceRef} />
    </Wrapper>
  )
}

const Wrapper = styled.div`
  margin-bottom: ${theme.spacing(12)};
`

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
`

const ListWrapper = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  padding: 10px ${theme.spacing(4)};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const ItemContainer = styled.div<{ $hasExtraSeeAllButton: boolean }>`
  position: relative;

  ${({ $hasExtraSeeAllButton }) =>
    $hasExtraSeeAllButton
      ? css`
          &:nth-last-of-type(2) {
            .item {
              border-radius: 0;
            }
          }
        `
      : css`
          &:nth-last-of-type(2) {
            .item {
              border-radius: 0 0 12px 12px;
              box-shadow: none;
            }
          }
        `}
`

const IssuingDateCell = styled(Typography)`
  min-width: 100px;
`
const NumberCellHeader = styled(Typography)`
  box-sizing: border-box;
  flex: 1;
`

const NumberCell = styled(Typography)`
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`

const PaymentCell = styled(Typography)`
  width: ${theme.spacing(7)};
  margin-right: 0 !important;

  > * {
    display: flex;
    justify-content: flex-start;
    min-width: 0;

    > svg {
      margin-right: 0 !important;
    }
  }
`

const AmountCell = styled(Typography)`
  flex: 1;
`

const ButtonMock = styled.div`
  width: 40px;
`

const DotsOpener = styled(PopperOpener)`
  right: ${theme.spacing(4)};
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }

  &:hover {
    cursor: pointer;
    background-color: ${theme.palette.grey[100]};
  }
`

const LoadingItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};

  &:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }

  > * {
    display: flex;
    align-items: center;

    > *:not(:last-child) {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const PlusButtonWrapper = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const WithTooltip = styled.div`
  border-bottom: 2px dotted ${theme.palette.grey[400]};
  width: fit-content;
  margin-top: 2px;
`
