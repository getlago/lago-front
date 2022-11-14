import { useRef } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { gql } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  theme,
  NAV_HEIGHT,
  HEADER_TABLE_HEIGHT,
  ItemContainer,
  PopperOpener,
  MenuPopper,
} from '~/styles'
import {
  Typography,
  Button,
  Skeleton,
  InfiniteScroll,
  Popper,
  Tooltip,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDownloadCreditNoteMutation, useGetInvoiceCreditNotesQuery } from '~/generated/graphql'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { addToast } from '~/core/apolloClient'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'

gql`
  query getInvoiceCreditNotes($invoiceId: ID!, $page: Int, $limit: Int) {
    invoiceCreditNotes(invoiceId: $invoiceId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        canBeVoided
        createdAt
        creditStatus
        number
        totalAmountCents
        totalAmountCurrency
      }
    }
  }

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }
`

const InvoiceCreditNoteList = () => {
  const { id, invoiceId } = useParams()
  let navigate = useNavigate()
  const { translate } = useInternationalization()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { data, loading, error, fetchMore } = useGetInvoiceCreditNotesQuery({
    variables: { invoiceId: invoiceId as string, limit: 20 },
    skip: !invoiceId,
  })
  const creditNotes = data?.invoiceCreditNotes?.collection
  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: downloadCreditNoteData }) {
        const fileUrl = downloadCreditNoteData?.fileUrl

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
    <div>
      {(loading || !!creditNotes?.length) && (
        <Header>
          <Typography variant="subhead">{translate('text_636bdef6565341dcb9cfb129')}</Typography>
          <Button variant="quaternary">{translate('text_636bdef6565341dcb9cfb127')} </Button>
        </Header>
      )}
      <>
        {!!error && !loading ? (
          <GenericPlaceholder
            title={translate('text_636d023ce11a9d038819b579')}
            subtitle={translate('text_636d023ce11a9d038819b57b')}
            buttonTitle={translate('text_636d023ce11a9d038819b57d')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : !loading && !creditNotes?.length ? (
          <EmptyStateTypography variant="body" color="grey500">
            {translate('text_636bdef6565341dcb9cfb12b')}
          </EmptyStateTypography>
        ) : (
          <>
            <ListHeader>
              <IssuingDateCell variant="bodyHl" color="disabled" noWrap>
                {translate('text_62544c1db13ca10187214d7f')}
              </IssuingDateCell>
              <NumberCellHeader variant="bodyHl" color="disabled" noWrap>
                {translate('text_62b31e1f6a5b8b1b745ece00')}
              </NumberCellHeader>
              <AmountCell variant="bodyHl" color="disabled" align="right" noWrap>
                {translate('text_62544c1db13ca10187214d85')}
              </AmountCell>
              <ButtonMock />
            </ListHeader>
            <InfiniteScroll
              onBottom={() => {
                const { currentPage = 0, totalPages = 0 } = data?.invoiceCreditNotes?.metadata || {}

                currentPage < totalPages &&
                  !loading &&
                  fetchMore({
                    variables: { page: currentPage + 1 },
                  })
              }}
            >
              <>
                {creditNotes?.map((creditNote, i) => (
                  <ItemContainer key={`credit-note-${i}`}>
                    <Item
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                            id,
                            invoiceId: invoiceId,
                            creditNoteId: creditNote.id,
                          })
                        )
                      }
                    >
                      <IssuingDateCell variant="body" color="grey700" noWrap>
                        {DateTime.fromISO(creditNote.createdAt).toFormat('LLL. dd, yyyy')}
                      </IssuingDateCell>
                      <NumberCell variant="body" color="grey700" noWrap>
                        {creditNote.number}
                      </NumberCell>
                      <AmountCell variant="body" color="success600" align="right" noWrap>
                        {intlFormatNumber(creditNote.totalAmountCents || 0, {
                          currencyDisplay: 'symbol',
                          currency: creditNote.totalAmountCurrency,
                        })}
                      </AmountCell>
                      <ButtonMock />
                    </Item>
                    <Popper
                      PopperProps={{ placement: 'bottom-end' }}
                      opener={({ isOpen }) => (
                        <DotsOpener>
                          <Tooltip
                            placement="top-end"
                            disableHoverListener={isOpen}
                            title={translate(
                              creditNote.canBeVoided
                                ? 'text_63728c6434e1344aea76347d'
                                : 'text_63728c6434e1344aea76347f'
                            )}
                          >
                            <Button icon="dots-horizontal" variant="quaternary" />
                          </Tooltip>
                        </DotsOpener>
                      )}
                    >
                      {({ closePopper }) => (
                        <MenuPopper>
                          <Button
                            variant="quaternary"
                            align="left"
                            disabled={loadingCreditNoteDownload}
                            onClick={async () => {
                              await downloadCreditNote({
                                variables: { input: { id: creditNote.id } },
                              })
                            }}
                          >
                            {translate('text_636d12ce54c41fccdf0ef72d')}
                          </Button>
                          {creditNote.canBeVoided && (
                            <Button
                              variant="quaternary"
                              align="left"
                              onClick={async () => {
                                voidCreditNoteDialogRef.current?.openDialog({
                                  id: creditNote.id,
                                  totalAmountCents: creditNote.totalAmountCents,
                                  totalAmountCurrency: creditNote.totalAmountCurrency,
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_636d12ce54c41fccdf0ef72f')}
                            </Button>
                          )}
                          <Button
                            variant="quaternary"
                            align="left"
                            onClick={() => {
                              navigator.clipboard.writeText(creditNote.id)
                              addToast({
                                severity: 'info',
                                translateKey: 'text_63720bd734e1344aea75b82d',
                              })
                              closePopper()
                            }}
                          >
                            {translate('text_636d12ce54c41fccdf0ef731')}
                          </Button>
                        </MenuPopper>
                      )}
                    </Popper>
                  </ItemContainer>
                ))}
                {loading && (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonLine key={`key-skeleton-line-${i}`}>
                        <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                        <Skeleton variant="text" width="38%" height={12} marginRight="11.2%" />
                        <Skeleton variant="text" width="12%" height={12} marginRight="6.4%" />
                        <Skeleton variant="text" width="38%" height={12} marginRight="9.25%" />
                      </SkeletonLine>
                    ))}
                  </>
                )}
              </>
            </InfiniteScroll>
          </>
        )}
      </>
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </div>
  )
}

export default InvoiceCreditNoteList

InvoiceCreditNoteList.displayName = 'InvoiceCreditNoteList'

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const EmptyStateTypography = styled(Typography)`
  margin-top: ${theme.spacing(6)};
`

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`
const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const IssuingDateCell = styled(Typography)`
  min-width: 100px;
`
const NumberCellHeader = styled(Typography)`
  flex: 1;
`

const AmountCell = styled(Typography)`
  flex: 1;
  margin-right: ${theme.spacing(4)};
`

const ButtonMock = styled.div`
  width: 40px;
`

const NumberCell = styled(Typography)`
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }

  &:hover {
    cursor: pointer;
    background-color: ${theme.palette.grey[100]};
  }
`

const DotsOpener = styled(PopperOpener)`
  right: 0;
`
