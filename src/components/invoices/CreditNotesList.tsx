import { ApolloError, gql, LazyQueryHookOptions } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { GetCreditNotesListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { ListContainer, ListHeader, NAV_HEIGHT, theme } from '~/styles'

import {
  CreditNoteListItem,
  CreditNoteListItemSkeleton,
  CreditNotesListItemGridTemplate,
} from './CreditNoteListItem'

import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '../customers/creditNotes/VoidCreditNoteDialog'
import { InfiniteScroll, Typography } from '../designSystem'
import { GenericPlaceholder } from '../GenericPlaceholder'

gql`
  fragment CreditNoteForCreditNoteList on CreditNote {
    id
    invoice {
      id
      customer {
        id
        applicableTimezone
      }
    }
  }
`

// Needed to be able to pass both ids to the keyboard navigation function
const ID_SPLIT_KEY = '&-%-&'
const NAVIGATION_KEY_BASE = 'creditNote-item-'

type TCreditNoteListProps = {
  creditNotes: GetCreditNotesListQuery['creditNotes']['collection'] | undefined
  error: ApolloError | undefined
  fetchMore: Function
  isLoading: boolean
  metadata: GetCreditNotesListQuery['creditNotes']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
}

const CreditNotesList = ({
  creditNotes,
  fetchMore,
  isLoading,
  metadata,
  variables,
}: TCreditNoteListProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const listContainerElementRef = useRef<HTMLDivElement>(null)

  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${NAVIGATION_KEY_BASE}${i}`,
    navigate: (id) => {
      const [customerId, invoiceId, creditNoteId] = String(id).split(ID_SPLIT_KEY)

      navigate(
        generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
          customerId,
          invoiceId,
          creditNoteId,
        }),
      )
    },
  })

  return (
    <ScrollContainer ref={listContainerElementRef} role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <List>
        <GridLine>
          <Typography variant="bodyHl" color="disabled" noWrap>
            {translate('text_64188b3d9735d5007d71227f')}
          </Typography>
          <Typography variant="bodyHl" color="disabled" noWrap>
            {translate('text_62b31e1f6a5b8b1b745ece00')}
          </Typography>
          <CustomerHeader variant="bodyHl" color="disabled" noWrap>
            {translate('text_63ac86d797f728a87b2f9fb3')}
          </CustomerHeader>
          <Typography variant="bodyHl" color="disabled" align="right" noWrap>
            {translate('text_62544c1db13ca10187214d85')}
          </Typography>
          <Typography variant="bodyHl" color="disabled" noWrap>
            {translate('text_62544c1db13ca10187214d7f')}
          </Typography>
        </GridLine>
        {isLoading && !!variables?.searchTerm ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <CreditNoteListItemSkeleton key={`key-initial-loading-skeleton-line-${i}`} />
            ))}
          </>
        ) : !isLoading && !!variables?.searchTerm && !creditNotes?.length ? (
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
                !isLoading &&
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            <>
              {creditNotes?.map((creditNote, index) => (
                <CreditNoteListItem
                  key={`credit-note-${index}`}
                  creditNote={creditNote}
                  navigationProps={{
                    id: `${NAVIGATION_KEY_BASE}${index}`,
                    'data-id': `${creditNote?.invoice?.customer?.id}${ID_SPLIT_KEY}${creditNote?.invoice?.id}${ID_SPLIT_KEY}${creditNote?.id}`,
                  }}
                  to={generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                    customerId: creditNote?.invoice?.customer?.id as string,
                    invoiceId: creditNote?.invoice?.id as string,
                    creditNoteId: creditNote?.id as string,
                  })}
                  voidCreditNoteDialogRef={voidCreditNoteDialogRef}
                />
              ))}
              {isLoading && (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <CreditNoteListItemSkeleton key={`key-scroll-loading-skeleton-line-${i}`} />
                  ))}
                </>
              )}
            </>
          </InfiniteScroll>
        )}
      </List>

      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </ScrollContainer>
  )
}

export default CreditNotesList

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
  ${CreditNotesListItemGridTemplate()}
  top: 0;
`

const CustomerHeader = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`
