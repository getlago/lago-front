import { ReactNode } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

import { CONNECTION_CATEGORY_SHORT_LABEL_KEYS, ConnectionCategory } from './types'

export const getCustomerConnectionRowTestId = (rowId: string): string =>
  `customer-connection-row-${rowId}`
export const getCustomerConnectionMenuTestId = (rowId: string): string =>
  `customer-connection-menu-${rowId}`
export const getCustomerConnectionGroupTestId = (category: ConnectionCategory): string =>
  `customer-connection-group-${category}`

/** Group display order on the information master-detail (per design) */
const GROUP_ORDER: ConnectionCategory[] = [
  ConnectionCategory.Payment,
  ConnectionCategory.Accounting,
  ConnectionCategory.Crm,
  ConnectionCategory.Tax,
]

export type CustomerConnectionRow = {
  /** Stable row key */
  id: string
  category: ConnectionCategory
  /** Connection (integration/provider) display name */
  name: string
  /** Secondary label (the connection code) */
  code?: string
  /** Provider avatar */
  icon?: ReactNode
}

type CustomerConnectionsListProps = {
  rows: CustomerConnectionRow[]
  /**
   * The Type column is shown on customer create/edit and hidden on the
   * customer information master-detail (narrower panel).
   */
  showTypeColumn?: boolean
  /**
   * Status column of the information master-detail. Cells stay empty until
   * the default flow lands and fills them with the Default badge.
   */
  showStatusColumn?: boolean
  /** Renders grey category header rows (Payment / Accounting / CRM / Tax) */
  grouped?: boolean
  /** Highlights the selected row (information master-detail) */
  selectedRowId?: string
  onEdit?: (row: CustomerConnectionRow) => void
  onDelete?: (row: CustomerConnectionRow) => void
  /** Row click (create/edit surface opens the edit drawer; information view selects) */
  onRowClick?: (row: CustomerConnectionRow) => void
}

/**
 * The shared customer-connections list: one row per connection (provider
 * avatar + name + code, an optional Type chip, a "…" menu with Edit /
 * Delete). Reused by customer create/edit (flat, Type column) and the
 * customer information master-detail (grouped by category, Status column,
 * selectable rows). The `Default` status badge lands with the default flow.
 */
export const CustomerConnectionsList = ({
  rows,
  showTypeColumn = true,
  showStatusColumn = false,
  grouped = false,
  selectedRowId,
  onEdit,
  onDelete,
  onRowClick,
}: CustomerConnectionsListProps) => {
  const { translate } = useInternationalization()

  if (!rows.length) return null

  const renderRow = (row: CustomerConnectionRow) => {
    const isSelected = !!selectedRowId && selectedRowId === row.id

    // Grouped (master-detail) rows are denser: 16px logo inline with the
    // name, code on its own line starting under the logo (per design)
    const rowContent = grouped ? (
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          {row.icon && (
            <Avatar size="small" variant="connector-full">
              {row.icon}
            </Avatar>
          )}
          <Typography variant="bodyHl" color="grey700">
            {row.name}
          </Typography>
        </div>
        {row.code && <Typography variant="caption">{row.code}</Typography>}
      </div>
    ) : (
      <>
        {row.icon && (
          <Avatar size="big" variant="connector-full">
            {row.icon}
          </Avatar>
        )}
        <div className="flex flex-col">
          <Typography variant="bodyHl" color="grey700">
            {row.name}
          </Typography>
          {row.code && <Typography variant="caption">{row.code}</Typography>}
        </div>
      </>
    )

    return (
      <div
        key={row.id}
        className={tw(
          'relative flex flex-row items-center gap-3 border-b border-grey-300 px-2 py-3',
          !!onRowClick && 'hover:bg-grey-100',
          isSelected && 'bg-grey-100',
        )}
        data-state={isSelected ? 'selected' : undefined}
        data-test={getCustomerConnectionRowTestId(row.id)}
      >
        {onRowClick ? (
          // Native button; its ::after overlay stretches the click target
          // to the whole row (the "…" menu sits above it with z-10)
          <button
            type="button"
            className="flex flex-1 cursor-pointer flex-row items-center gap-3 text-left after:absolute after:inset-0 after:content-['']"
            onClick={() => onRowClick(row)}
          >
            {rowContent}
          </button>
        ) : (
          <div className="flex flex-1 flex-row items-center gap-3">{rowContent}</div>
        )}

        {showTypeColumn && (
          <div className="w-30">
            <Chip label={translate(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[row.category])} />
          </div>
        )}

        {/* Status cell: empty placeholder until the Default badge lands */}
        {showStatusColumn && <div className="w-30" />}

        {(!!onEdit || !!onDelete) && (
          <div className="relative z-10">
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={
                <Button
                  icon="dots-horizontal"
                  variant="quaternary"
                  data-test={getCustomerConnectionMenuTestId(row.id)}
                />
              }
            >
              {({ closePopper }) => (
                <MenuPopper>
                  {!!onEdit && (
                    <Button
                      startIcon="pen"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        onEdit(row)
                        closePopper()
                      }}
                    >
                      {translate('text_65845f35d7d69c3ab4793dac')}
                    </Button>
                  )}
                  {!!onDelete && (
                    <Button
                      startIcon="trash"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        onDelete(row)
                        closePopper()
                      }}
                    >
                      {translate('text_65845f35d7d69c3ab4793dad')}
                    </Button>
                  )}
                </MenuPopper>
              )}
            </Popper>
          </div>
        )}
      </div>
    )
  }

  const renderBody = () => {
    if (!grouped) return rows.map(renderRow)

    return GROUP_ORDER.filter((category) => rows.some((row) => row.category === category)).map(
      (category) => (
        <div key={category} className="flex flex-col">
          <div
            className="border-b border-grey-300 bg-grey-100 p-2"
            data-test={getCustomerConnectionGroupTestId(category)}
          >
            <Typography variant="captionHl" color="grey600">
              {translate(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[category])}
            </Typography>
          </div>
          {rows.filter((row) => row.category === category).map(renderRow)}
        </div>
      ),
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-3 border-b border-grey-300 px-2 py-3">
        <Typography className="flex-1" variant="captionHl" color="grey600">
          {translate('text_65e1f90471bc198c0c934d6c')}
        </Typography>
        {showTypeColumn && (
          <Typography className="w-30" variant="captionHl" color="grey600">
            {translate('text_632d68358f1fedc68eed3e5a')}
          </Typography>
        )}
        {showStatusColumn && (
          <Typography className="w-30" variant="captionHl" color="grey600">
            {translate('text_63ac86d797f728a87b2f9fa7')}
          </Typography>
        )}
        {/* "…" menu column spacer */}
        <div className="w-10" />
      </div>

      {renderBody()}
    </div>
  )
}
