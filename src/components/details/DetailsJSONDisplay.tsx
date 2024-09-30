import { Typography } from '@mui/material'
import styled from 'styled-components'

import { JsonEditor } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'

type DetailsJSONDisplayData = {
  header: string
  value: string
}

const DetailsJSONDisplay = (data: DetailsJSONDisplayData) => {
  const { translate } = useInternationalization()

  return (
    <StyledTable>
      <thead>
        <tr>
          <th key={`details-json-display-header`}>
            <Typography variant="captionHl">{data.header}</Typography>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr key={`details-json-display-row`}>
          <JsonEditor
            label={translate('text_663dea5702b60301d8d06502')}
            value={data.value}
            hideLabel
            readOnly
          />
        </tr>
      </tbody>
    </StyledTable>
  )
}

const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  table-layout: 'fixed';
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  /* Used to hide non-rounded elements to overflow */
  overflow: hidden;
  /* Show back the border, hidden with TW default property border-collapse: collapse; */
  border-collapse: initial;

  > thead > tr > th,
  > tbody > tr > td {
    text-align: left;
  }

  > thead > tr > th {
    height: ${HEADER_TABLE_HEIGHT}px;
    vertical-align: middle;
    padding: 0 ${theme.spacing(4)};
    box-sizing: border-box;
    box-shadow: ${theme.shadows[7]};
    background-color: ${theme.palette.grey[100]};
  }

  > tbody > tr > td {
    height: ${HEADER_TABLE_HEIGHT}px;
    vertical-align: middle;
    min-height: 44px;
    padding: 0 ${theme.spacing(4)};
    color: ${theme.palette.grey[700]};
  }

  /* Separator */
  > thead > tr > th:not(:last-child),
  > tbody > tr > td:not(:last-child) {
    border-right: 1px solid ${theme.palette.grey[300]};
  }
  > tbody > tr:not(:last-child) > td {
    box-shadow: ${theme.shadows[7]};
  }
`

export default DetailsJSONDisplay
