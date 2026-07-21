import { ReactNode } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import { CONNECTION_CATEGORY_SHORT_LABEL_KEYS, ConnectionCategory } from './types'

export const getCustomerConnectionRowTestId = (category: ConnectionCategory): string =>
  `customer-connection-row-${category}`
export const getCustomerConnectionMenuTestId = (category: ConnectionCategory): string =>
  `customer-connection-menu-${category}`

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
  onEdit?: (row: CustomerConnectionRow) => void
  onDelete?: (row: CustomerConnectionRow) => void
  /** Row click (create/edit surface opens the edit drawer; information view selects) */
  onRowClick?: (row: CustomerConnectionRow) => void
}

/**
 * The shared customer-connections list: one row per connection (provider
 * avatar + name + code, an optional Type chip, a "…" menu with Edit /
 * Delete). Reused by customer create/edit and the customer information view
 * with different column configurations. The `Default` status badge lands with
 * the default flow (ING-441).
 */
export const CustomerConnectionsList = ({
  rows,
  showTypeColumn = true,
  onEdit,
  onDelete,
  onRowClick,
}: CustomerConnectionsListProps) => {
  const { translate } = useInternationalization()

  if (!rows.length) return null

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center gap-3 border-b border-grey-300 py-3">
        <Typography className="flex-1" variant="captionHl" color="grey600">
          {translate('text_65e1f90471bc198c0c934d6c')}
        </Typography>
        {showTypeColumn && (
          <Typography className="w-30" variant="captionHl" color="grey600">
            {translate('text_632d68358f1fedc68eed3e5a')}
          </Typography>
        )}
        {/* "…" menu column spacer */}
        <div className="w-10" />
      </div>

      {rows.map((row) => {
        const rowContent = (
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
            className={`relative flex flex-row items-center gap-3 border-b border-grey-300 px-2 py-3 ${
              onRowClick ? 'hover:bg-grey-100' : ''
            }`}
            data-test={getCustomerConnectionRowTestId(row.category)}
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

            <div className="relative z-10">
              <Popper
                PopperProps={{ placement: 'bottom-end' }}
                opener={
                  <Button
                    icon="dots-horizontal"
                    variant="quaternary"
                    data-test={getCustomerConnectionMenuTestId(row.category)}
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
          </div>
        )
      })}
    </div>
  )
}
