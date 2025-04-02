import { ApolloError, gql, LazyQueryHookOptions } from '@apollo/client'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import styled, { css } from 'styled-components'

import CreditNoteBadge from '~/components/creditNote/CreditNoteBadge'
import {
  VoidCreditNoteDialog,
  VoidCreditNoteDialogRef,
} from '~/components/customers/creditNotes/VoidCreditNoteDialog'
import {
  ActionItem,
  InfiniteScroll,
  Skeleton,
  Table,
  TableColumn,
  TableContainerSize,
  Typography,
} from '~/components/designSystem'
import { AvailableFiltersEnum, Filters } from '~/components/designSystem/Filters'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { CREDIT_NOTE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { handleDownloadFile } from '~/core/utils/downloadFiles'
import { ResponsiveStyleValue } from '~/core/utils/responsiveProps'
import {
  CreditNoteForVoidCreditNoteDialogFragmentDoc,
  CreditNoteTableItemFragment,
  GetCreditNotesListQuery,
  PremiumIntegrationTypeEnum,
  TimezoneEnum,
  useDownloadCreditNoteMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { BaseListItem, theme } from '~/styles'
import { tw } from '~/styles/utils'

const { disablePdfGeneration } = envGlobalVar()

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
    taxProviderSyncable
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

type TCreditNoteTableProps = {
  creditNotes: GetCreditNotesListQuery['creditNotes']['collection'] | undefined
  error: ApolloError | undefined
  fetchMore: (options: {
    variables: { page: number }
  }) => Promise<{ data?: GetCreditNotesListQuery }>
  isLoading: boolean
  metadata: GetCreditNotesListQuery['creditNotes']['metadata'] | undefined
  variables: LazyQueryHookOptions['variables'] | undefined
  customerTimezone?: TimezoneEnum
  tableContainerSize?: ResponsiveStyleValue<TableContainerSize>
  showFilters?: boolean
  filtersContainerClassName?: string
}

const CreditNoteTableItemSkeleton = () => {
  return (
    <SkeletonLine>
      <Skeleton variant="text" className="w-45" />
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="text" className="w-40" />
      <Skeleton className="hidden w-40 justify-self-end md:flex" variant="text" />
      <Skeleton variant="text" className="w-28" />
      <Skeleton variant="text" className="w-10" />
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
  tableContainerSize,
  showFilters = true,
  filtersContainerClassName,
}: TCreditNoteTableProps) => {
  const { translate } = useInternationalization()
  const voidCreditNoteDialogRef = useRef<VoidCreditNoteDialogRef>(null)
  const { formatTimeOrgaTZ, organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()

  const hasAccessToRevenueShare = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.RevenueShare,
  )
  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteMutation({
      onCompleted({ downloadCreditNote: data }) {
        handleDownloadFile(data?.fileUrl)
      },
    })

  const showCustomerName = !customerTimezone

  return (
    <>
      {showFilters && (
        <div
          className={tw(
            'box-border flex w-full flex-col gap-3 p-4 shadow-b md:px-12 md:py-3',
            filtersContainerClassName,
          )}
        >
          <Filters.Provider
            filtersNamePrefix={CREDIT_NOTE_LIST_FILTER_PREFIX}
            availableFilters={[
              AvailableFiltersEnum.amount,
              AvailableFiltersEnum.creditNoteCreditStatus,
              AvailableFiltersEnum.currency,
              AvailableFiltersEnum.customerExternalId,
              AvailableFiltersEnum.invoiceNumber,
              AvailableFiltersEnum.issuingDate,
              AvailableFiltersEnum.creditNoteReason,
              AvailableFiltersEnum.creditNoteRefundStatus,
              ...(hasAccessToRevenueShare ? [AvailableFiltersEnum.selfBilled] : []),
            ]}
          >
            <Filters.Component />
          </Filters.Provider>
        </div>
      )}

      <div>
        {isLoading && !!variables?.searchTerm && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <CreditNoteTableItemSkeleton key={`key-initial-loading-skeleton-line-${i}`} />
            ))}
          </>
        )}

        {!isLoading && !!variables?.searchTerm && !creditNotes?.length && (
          <GenericPlaceholder
            title={translate('text_63c6edd80c57d0dfaae389a4')}
            subtitle={translate('text_63c6edd80c57d0dfaae389a8')}
            image={<EmptyImage width="136" height="104" />}
          />
        )}

        {(!isLoading || !variables?.searchTerm || !!creditNotes?.length) && (
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
            <Table
              name="credit-notes-list"
              data={creditNotes || []}
              containerSize={
                tableContainerSize || {
                  default: 0,
                }
              }
              isLoading={isLoading}
              hasError={!!error}
              placeholder={{
                emptyState: {
                  title: translate('text_6663014df0a6be0098264dd9'),
                  subtitle: translate('text_6663014df0a6be0098264dda'),
                },
              }}
              actionColumnTooltip={(creditNote) =>
                translate(
                  creditNote.canBeVoided && hasPermissions(['creditNotesVoid'])
                    ? 'text_63728c6434e1344aea76347d'
                    : 'text_63728c6434e1344aea76347f',
                )
              }
              actionColumn={(creditNote) => {
                let actions: ActionItem<CreditNoteTableItemFragment>[] = []

                const canDownload = hasPermissions(['creditNotesView']) && !disablePdfGeneration
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
              onRowActionLink={(creditNote) =>
                generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
                  customerId: creditNote?.invoice?.customer?.id as string,
                  invoiceId: creditNote?.invoice?.id as string,
                  creditNoteId: creditNote?.id as string,
                })
              }
              columns={[
                {
                  key: 'totalAmountCents',
                  title: translate('text_1727078012568v9460bmnh8a'),
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
                    <Typography
                      className="font-medium"
                      variant="body"
                      color={showCustomerName ? 'grey700' : 'success600'}
                      align="right"
                      noWrap
                    >
                      {intlFormatNumber(deserializeAmount(totalAmountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency,
                      })}
                    </Typography>
                  ),
                  maxSpace: !showCustomerName,
                  textAlign: 'right',
                },
                ...(showCustomerName
                  ? [
                      {
                        key: 'invoice.customer.displayName',
                        title: translate('text_63ac86d797f728a87b2f9fb3'),
                        content: (creditNote: CreditNoteTableItemFragment) => (
                          <Typography variant="body" color="grey600" noWrap>
                            {creditNote.invoice?.customer.displayName}
                          </Typography>
                        ),
                        maxSpace: true,
                        tdCellClassName: 'hidden md:table-cell',
                      } as TableColumn<CreditNoteTableItemFragment>,
                    ]
                  : []),
                {
                  key: 'createdAt',
                  title: translate('text_62544c1db13ca10187214d7f'),
                  content: ({ createdAt }) => (
                    <Typography variant="body" color="grey600" noWrap>
                      {customerTimezone
                        ? formatDateToTZ(createdAt, customerTimezone)
                        : formatTimeOrgaTZ(createdAt)}
                    </Typography>
                  ),
                },
              ]}
            />
          </InfiniteScroll>
        )}
      </div>

      <VoidCreditNoteDialog ref={voidCreditNoteDialogRef} />
    </>
  )
}

export default CreditNotesTable

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
