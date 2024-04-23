import { Typography } from '@mui/material'
import styled from 'styled-components'

import { HEADER_TABLE_HEIGHT, theme } from '~/styles'

type DetailsTableDisplayData = {
  header: Array<string>
  body: Array<Array<string | number>>
}

const DetailsTableDisplay = (data: DetailsTableDisplayData) => {
  return (
    <StyledTable $dataLength={data.header.length || 1}>
      <thead>
        <tr>
          {data.header.map((header, index) => (
            <th key={`details-table-display-header-${index}`}>
              <Typography variant="captionHl">{header}</Typography>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.body.map((values, i) => (
          <tr key={`details-table-display-body-tr-${i}`}>
            {values.map((value, j) => (
              <td key={`details-table-display-tr-${i}-td-${j}`}>
                <Typography variant="body">{value}</Typography>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  )
}

const StyledTable = styled.table<{ $dataLength: number }>`
  width: 100%;
  border-spacing: 0;
  table-layout: ${({ $dataLength }) => ($dataLength > 3 ? 'auto' : 'fixed')};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  /* Used to hide non-rounded elements to overflow */
  overflow: hidden;

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

export default DetailsTableDisplay
