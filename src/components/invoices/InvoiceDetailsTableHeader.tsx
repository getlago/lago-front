import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface InvoiceDetailsTableHeaderProps {
  displayName?: string
  period?: string
  newFormat?: boolean
}

export const InvoiceDetailsTableHeader = memo(
  ({ displayName, period, newFormat }: InvoiceDetailsTableHeaderProps) => {
    const { translate } = useInternationalization()

    return (
      <thead>
        <tr>
          <th>
            {!!displayName && (
              <Typography
                variant={newFormat ? 'captionHl' : 'bodyHl'}
                color={newFormat ? 'grey600' : 'grey700'}
              >
                {displayName}
              </Typography>
            )}
            {!!period && (
              <Typography
                variant={newFormat ? 'captionHl' : 'caption'}
                color={newFormat ? 'grey600' : 'grey500'}
              >
                {period}
              </Typography>
            )}
          </th>
          <th>
            <Typography
              variant={newFormat ? 'captionHl' : 'bodyHl'}
              color={newFormat ? 'grey600' : 'grey500'}
            >
              {translate(
                newFormat ? 'text_65771fa3f4ab9a00720726ce' : 'text_634d631acf4dce7b0127a3a0',
              )}
            </Typography>
          </th>
          {!!newFormat && (
            <th>
              <Typography variant="captionHl" color="grey600">
                {translate('text_6453819268763979024ad089')}
              </Typography>
            </th>
          )}
          <th>
            <Typography
              variant={newFormat ? 'captionHl' : 'bodyHl'}
              color={newFormat ? 'grey600' : 'grey500'}
            >
              {translate('text_636bedf292786b19d3398f06')}
            </Typography>
          </th>
          <th>
            <Typography
              variant={newFormat ? 'captionHl' : 'bodyHl'}
              color={newFormat ? 'grey600' : 'grey500'}
            >
              {translate('text_634d631acf4dce7b0127a3a6')}
            </Typography>
          </th>
        </tr>
      </thead>
    )
  },
)

InvoiceDetailsTableHeader.displayName = 'InvoiceDetailsTableHeader'
