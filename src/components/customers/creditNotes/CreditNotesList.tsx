import { gql } from '@apollo/client'
import { memo, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Button,
  InfiniteScroll,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  useDownloadCreditNoteMutation,
  CreditNotesForListFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import {
  HEADER_TABLE_HEIGHT,
  ItemContainer,
  MenuPopper,
  NAV_HEIGHT,
  PopperOpener,
  theme,
} from '~/styles'
import { getTimezoneConfig, formatDateToTZ } from '~/core/timezone'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'

import { VoidCreditNoteDialog, VoidCreditNoteDialogRef } from './VoidCreditNoteDialog'

gql`
  fragment CreditNotesForList on CreditNoteCollection {
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

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }
`

interface CreditNotesListProps {
  creditNotes: CreditNotesForListFragment['collection'] | undefined
  fetchMore: Function
  itemClickRedirection: string
  loading: boolean
  hasSearchQuery?: boolean
  metadata: CreditNotesForListFragment['metadata'] | undefined
  customerTimezone: TimezoneEnum
}

const CreditNotesList = memo(
  ({
    creditNotes,
    fetchMore,
    itemClickRedirection,
    loading,
    hasSearchQuery = false,
    metadata,
    customerTimezone,
  }: CreditNotesListProps) => {
    const { translate } = useInternationalization()
    const navigate = useNavigate()
    const { id: customerId, invoiceId } = useParams()
    const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
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
      <>
        <ListHeader>
          <NumberCellHeader variant="bodyHl" color="disabled" noWrap>
            {translate('text_62b31e1f6a5b8b1b745ece00')}
          </NumberCellHeader>
          <AmountCell variant="bodyHl" color="disabled" align="right" noWrap>
            {translate('text_62544c1db13ca10187214d85')}
          </AmountCell>
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
          <ButtonMock />
        </ListHeader>
        {loading && hasSearchQuery ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLine key={`key-skeleton-line-${i}`}>
                <Skeleton variant="text" width={140} height={12} />
                <SkeletonRightBlock>
                  <Skeleton variant="text" width={80} height={12} />
                  <Skeleton variant="text" width={90} height={12} />
                </SkeletonRightBlock>
              </SkeletonLine>
            ))}
          </>
        ) : !loading && hasSearchQuery && !creditNotes?.length ? (
          <GenericPlaceholder
            title={translate('text_63c6edd80c57d0dfaae389a4')}
            subtitle={translate('text_63c6edd80c57d0dfaae389a8')}
            image={<EmptyImage width="136" height="104" />}
          />
        ) : (
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = metadata || {}

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
                        generatePath(itemClickRedirection, {
                          id: customerId,
                          invoiceId: invoiceId,
                          creditNoteId: creditNote.id,
                        })
                      )
                    }
                  >
                    <NumberCell variant="captionCode" color="grey700" noWrap>
                      {creditNote.number}
                    </NumberCell>
                    <AmountCell variant="body" color="success600" align="right" noWrap>
                      {intlFormatNumber(
                        deserializeAmount(
                          creditNote.totalAmountCents || 0,
                          creditNote.totalAmountCurrency
                        ),
                        {
                          currencyDisplay: 'symbol',
                          currency: creditNote.totalAmountCurrency,
                        }
                      )}
                    </AmountCell>
                    <IssuingDateCell variant="body" color="grey700" noWrap>
                      {formatDateToTZ(creditNote.createdAt, customerTimezone)}
                    </IssuingDateCell>
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
                            copyToClipboard(creditNote.id)

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
                      <Skeleton variant="text" width={140} height={12} />
                      <SkeletonRightBlock>
                        <Skeleton variant="text" width={80} height={12} />
                        <Skeleton variant="text" width={90} height={12} />
                      </SkeletonRightBlock>
                    </SkeletonLine>
                  ))}
                </>
              )}
            </>
          </InfiniteScroll>
        )}
        <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
      </>
    )
  }
)

CreditNotesList.displayName = 'CreditNotesList'

const SkeletonLine = styled.div`
  display: flex;
  align-items: center;
  height: ${NAV_HEIGHT}px;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`

const SkeletonRightBlock = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-right: ${theme.spacing(14)};

  > * {
    margin-right: ${theme.spacing(4)};
  }
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
  min-width: 112px;
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

const WithTooltip = styled.div`
  border-bottom: 2px dotted ${theme.palette.grey[400]};
  width: fit-content;
  margin-top: 2px;
`

export default CreditNotesList
