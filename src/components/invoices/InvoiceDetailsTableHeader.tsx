import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface InvoiceDetailsTableHeaderProps {
  displayName?: string
  period?: string
}

export const InvoiceDetailsTableHeader = memo(
  ({ displayName, period }: InvoiceDetailsTableHeaderProps) => {
    const { translate } = useInternationalization()

    return (
      <thead>
        <tr>
          <th>
            {!!displayName && (
              <Typography variant="bodyHl" color="grey700">
                {displayName}
              </Typography>
            )}
            {!!period && (
              <Typography variant="caption" color="grey500">
                {period}
              </Typography>
            )}
          </th>
          <th>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_634d631acf4dce7b0127a3a0')}
            </Typography>
          </th>
          <th>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_636bedf292786b19d3398f06')}
            </Typography>
          </th>
          <th>
            <Typography variant="bodyHl" color="grey500">
              {translate('text_634d631acf4dce7b0127a3a6')}
            </Typography>
          </th>
        </tr>
      </thead>
    )
  }
)

InvoiceDetailsTableHeader.displayName = 'InvoiceDetailsTableHeader'
