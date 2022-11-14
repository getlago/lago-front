import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  CurrencyEnum,
  useDownloadCreditNoteMutation,
  useGetCustomerCreditNotesQuery,
} from '~/generated/graphql'
import {
  Avatar,
  Button,
  Icon,
  InfiniteScroll,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  HEADER_TABLE_HEIGHT,
  ItemContainer,
  MenuPopper,
  NAV_HEIGHT,
  PopperOpener,
  theme,
} from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'

import { VoidCreditNoteDialog, VoidCreditNoteDialogRef } from './creditNotes/VoidCreditNoteDialog'

gql`
  query getCustomerCreditNotes($customerId: ID!, $page: Int, $limit: Int) {
    customerCreditNotes(customerId: $customerId, page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        canBeVoided
        createdAt
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

interface CustomerCreditNotesListProps {
  customerId: string
  creditNotesCreditsAvailableCount?: number
  creditNotesBalanceAmountCents?: number
  userCurrency?: CurrencyEnum
}

export const CustomerCreditNotesList = ({
  customerId,
  creditNotesCreditsAvailableCount,
  creditNotesBalanceAmountCents,
  userCurrency,
}: CustomerCreditNotesListProps) => {
  let navigate = useNavigate()
  const { translate } = useInternationalization()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { data, loading, error, fetchMore } = useGetCustomerCreditNotesQuery({
    variables: { customerId, limit: 20 },
    skip: !customerId,
  })
  const creditNotes = data?.customerCreditNotes?.collection
  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: creditNoteToDownload }) {
        const fileUrl = creditNoteToDownload?.fileUrl

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
    <SideSection>
      <SectionHeader variant="subhead" color="grey700" $hideBottomShadow>
        {translate('text_63725b30957fd5b26b308dd7')}
      </SectionHeader>
      <TotalCreditAmountWrapper>
        <TotalCreditAmountLeftWrapper>
          <Avatar variant="connector">
            <Icon name="wallet" color="dark" />
          </Avatar>
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_63725b30957fd5b26b308dd9')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_63725b30957fd5b26b308ddb', {
                count: creditNotesCreditsAvailableCount,
              })}
            </Typography>
          </div>
        </TotalCreditAmountLeftWrapper>
        <Typography variant="body" color="grey700">
          {intlFormatNumber(creditNotesBalanceAmountCents || 0, {
            currencyDisplay: 'symbol',
            currency: userCurrency,
          })}
        </Typography>
      </TotalCreditAmountWrapper>

      <SectionHeader variant="subhead" color="grey700">
        {translate('text_63725b30957fd5b26b308ddf')}
      </SectionHeader>
      {!!error && !loading ? (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          buttonTitle={translate('text_636d023ce11a9d038819b57d')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : !!creditNotes && !!creditNotes?.length ? (
        <>
          <ListHeader>
            <IssuingDateCell variant="bodyHl" color="disabled" noWrap>
              {translate('text_63725b30957fd5b26b308de1')}
            </IssuingDateCell>
            <NumberCellHeader variant="bodyHl" color="disabled" noWrap>
              {translate('text_63725b30957fd5b26b308de3')}
            </NumberCellHeader>
            <AmountCell variant="bodyHl" color="disabled" align="right">
              {translate('text_63725b30957fd5b26b308de5')}
            </AmountCell>
            <ButtonMock />
          </ListHeader>
          <InfiniteScroll
            onBottom={() => {
              const { currentPage = 0, totalPages = 0 } = data?.customerCreditNotes?.metadata || {}

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
                        generatePath(CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE, {
                          id: customerId,
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
                          {translate('text_63725b30957fd5b26b308df9')}
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
                            {translate('text_63725b30957fd5b26b308dfb')}
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
                          {translate('text_63725b30957fd5b26b308dfd')}
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
                      <Skeleton variant="text" width="12%" height={12} marginRight="7%" />
                      <Skeleton variant="text" width="40%" height={12} marginRight="28%" />
                      <Skeleton variant="text" width="28%" height={12} marginRight="10%" />
                    </SkeletonLine>
                  ))}
                </>
              )}
            </>
          </InfiniteScroll>
        </>
      ) : undefined}
      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </SideSection>
  )
}

const TotalCreditAmountWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  margin-bottom: ${theme.spacing(8)};
  box-sizing: border-box;
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const TotalCreditAmountLeftWrapper = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
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

const AmountCell = styled(Typography)`
  flex: 1;
`

const ButtonMock = styled.div`
  width: 40px;
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

const SkeletonLine = styled.div`
  display: flex;
  margin-top: ${theme.spacing(7)};
`

const DotsOpener = styled(PopperOpener)`
  right: 0;
`
