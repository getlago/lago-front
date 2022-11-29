import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface InvoiceDetailsTableHeaderProps {
  displayName: string
}

export const InvoiceDetailsTableHeader = memo(({ displayName }: InvoiceDetailsTableHeaderProps) => {
  const { translate } = useInternationalization()

  return (
    <thead>
      <tr>
        <th>
          <Typography variant="bodyHl" color="grey500">
            {displayName}
          </Typography>
        </th>
        <th>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_634d631acf4dce7b0127a3a0')}
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
})

InvoiceDetailsTableHeader.displayName = 'InvoiceDetailsTableHeader'
