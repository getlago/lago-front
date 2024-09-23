import { ApolloError, gql, LazyQueryHookOptions } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import CreditNoteBadge from '~/components/creditNote/CreditNoteBadge'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CreditNoteForVoidCreditNoteDialogFragmentDoc,
  CreditNoteTableItemFragment,
  GetCreditNotesListQuery,
  TimezoneEnum,
  useDownloadCreditNoteMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { BaseListItem, ListContainer, NAV_HEIGHT, theme } from '~/styles'

import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '../customers/creditNotes/VoidCreditNoteDialog'
import {
  ActionItem,
  InfiniteScroll,
  Skeleton,
  Table,
  TableColumn,
  Typography,
} from '../designSystem'
import { GenericPlaceholder } from '../GenericPlaceholder'

gql`
  fragment CreditNoteTableItem on CreditNote {
    id
    number
    totalAmountCents
    refundAmountCents
    creditAmountCents
    currency
    createdAt
    canBeVoided
    voidedAt
    errorDetails {
      id
      errorCode
      errorDetails
    }
    invoice {
      id
      number
      customer {
        id
        name
        displayName
        applicableTimezone
      }
    }
  }

  fragment CreditNotesForTable on CreditNoteCollection {
    metadata {
      currentPage
      totalPages
      totalCount
    }
    collection {
      id
      ...CreditNoteTableItem
    }
  }

  mutation downloadCreditNote($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }

  ${CreditNoteForVoidCreditNoteDialogFragmentDoc}
`

// Needed to be able to pass both ids to the keyboard navigation function
const ID_SPLIT_KEY = '&-%-&'
const NAVIGATION_KEY_BASE = 'creditNote-item-'

type TCreditNoteTableProps = {
  creditNotes: GetCreditNotesListQuery['creditNotes']['collection'] | undefined
  error: ApolloError | undefined
  fetchMore: Function
  isLoading: boolean
  metadata: GetCreditNotesListQuery['creditNotes']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
  customerTimezone?: TimezoneEnum
}

const CreditNoteTableItemSkeleton = () => {
  return (
    <SkeletonLine>
      <Skeleton variant="text" width={180} height={12} />
      <Skeleton variant="text" width={80} height={12} />
      <Skeleton variant="text" width={160} height={12} />
      <RightSkeleton variant="text" width={160} height={12} />
      <Skeleton variant="text" width={112} height={12} />
      <Skeleton variant="text" width={40} height={12} />
    </SkeletonLine>
  )
}

const CreditNotesTable = ({
  creditNotes,
  fetchMore,
  isLoading,
  metadata,
  variables,
  customerTimezone,
  error,
}: TCreditNoteTableProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const listContainerElementRef = useRef<HTMLDivElement>(null)
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()

  const isCustomer = !!customerTimezone

  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: data }) {
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
        } else {
          addToast({
            severity: 'danger',
            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
          })
        }
      },
    })

  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${NAVIGATION_KEY_BASE}${i}`,
    navigate: (id) => {
      const [customerId, invoiceId, creditNoteId] = String(id).split(ID_SPLIT_KEY)

      navigate(
        generatePath(
          isCustomer
            ? CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE
            : CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
          {
            customerId,
            invoiceId,
            creditNoteId,
          },
        ),
      )
    },
  })

  const showCustomerName = !customerTimezone

  return (
    <ScrollContainer ref={listContainerElementRef} role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <List>
        {isLoading && !!variables?.searchTerm ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <CreditNoteTableItemSkeleton key={`key-initial-loading-skeleton-line-${i}`} />
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
              <Table
                name="credit-notes-list"
                data={creditNotes || []}
                containerSize={{
                  default: 16,
                  md: 48,
                }}
                isLoading={isLoading}
                hasError={!!error}
                actionColumn={(creditNote) => {
                  let actions: ActionItem<CreditNoteTableItemFragment>[] = []

                  const canDownload = hasPermissions(['creditNotesView'])
                  const canVoid = creditNote.canBeVoided && hasPermissions(['creditNotesVoid'])

                  if (canDownload) {
                    actions = [
                      ...actions,
                      {
                        title: translate('text_636d12ce54c41fccdf0ef72d'),
                        disabled: loadingCreditNoteDownload,
                        onAction: async ({ id }: { id: string }) => {
                          await downloadCreditNote({
                            variables: { input: { id } },
                          })
                        },
                      },
                    ]
                  }

                  if (canVoid) {
                    actions = [
                      ...actions,
                      {
                        title: translate('text_636d12ce54c41fccdf0ef72f'),
                        onAction: async ({ id, totalAmountCents, currency }) => {
                          voidCreditNoteDialogRef.current?.openDialog({
                            id,
                            totalAmountCents,
                            currency,
                          })
                        },
                      },
                    ]
                  }

                  actions = [
                    ...actions,
                    {
                      title: translate('text_636d12ce54c41fccdf0ef731'),
                      onAction: async ({ id }: { id: string }) => {
                        copyToClipboard(id)

                        addToast({
                          severity: 'info',
                          translateKey: 'text_63720bd734e1344aea75b82d',
                        })
                      },
                    },
                  ]

                  return actions
                }}
                onRowAction={(creditNote) => {
                  navigate(
                    generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                      customerId: creditNote?.invoice?.customer?.id as string,
                      invoiceId: creditNote?.invoice?.id as string,
                      creditNoteId: creditNote?.id as string,
                    }),
                  )
                }}
                columns={[
                  {
                    key: 'totalAmountCents',
                    title: 'TODO: Type',
                    content: (creditNote) => <CreditNoteBadge creditNote={creditNote} />,
                  },
                  {
                    key: 'number',
                    title: translate('text_64188b3d9735d5007d71227f'),
                    minWidth: 160,
                    content: ({ number }) => (
                      <Typography variant="body" noWrap>
                        {number}
                      </Typography>
                    ),
                  },
                  {
                    key: 'totalAmountCents',
                    title: translate('text_62544c1db13ca10187214d85'),
                    content: ({ totalAmountCents, currency }) => (
                      <Typography variant="body" align="right" noWrap>
                        {intlFormatNumber(deserializeAmount(totalAmountCents || 0, currency), {
                          currencyDisplay: 'symbol',
                          currency,
                        })}
                      </Typography>
                    ),
                  },
                  ...(showCustomerName
                    ? [
                        {
                          key: 'invoice.customer.displayName',
                          title: translate('text_63ac86d797f728a87b2f9fb3'),
                          content: (creditNote: CreditNoteTableItemFragment) => (
                            <CustomerColumn variant="body" color="grey700" noWrap>
                              {creditNote.invoice?.customer.displayName}
                            </CustomerColumn>
                          ),
                        } as TableColumn<CreditNoteTableItemFragment>,
                      ]
                    : []),
                  {
                    key: 'createdAt',
                    title: translate('text_62544c1db13ca10187214d7f'),
                    content: ({ createdAt }) => (
                      <Typography variant="body" color="grey700" noWrap>
                        {customerTimezone
                          ? formatDateToTZ(createdAt, customerTimezone)
                          : formatTimeOrgaTZ(createdAt)}
                      </Typography>
                    ),
                  },
                ]}
              />
            </>
          </InfiniteScroll>
        )}
      </List>

      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </ScrollContainer>
  )
}

export default CreditNotesTable

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

const CreditNotesTableItemGridTemplate = () => css`
  display: grid;
  grid-template-columns: minmax(200px, auto) minmax(160px, auto) 1fr 1fr 112px 40px;
  gap: ${theme.spacing(3)};

  ${theme.breakpoints.down('md')} {
    grid-template-columns: minmax(200px, auto) minmax(160px, auto) 1fr 112px 40px;
  }
`

const Grid = () => css`
  position: relative;
  align-items: center;
  width: 100%;
  ${CreditNotesTableItemGridTemplate()}
`

const SkeletonLine = styled(BaseListItem)`
  ${Grid()}
`

const RightSkeleton = styled(Skeleton)`
  display: flex;
  justify-self: end;

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const CustomerColumn = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`
