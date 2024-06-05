import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'

type TNetsuiteIntegrationItemHeaderProps = {
  columnName: string
}

const NetsuiteIntegrationItemHeader = ({ columnName }: TNetsuiteIntegrationItemHeaderProps) => {
  const { translate } = useInternationalization()

  return (
    <ItemHeader>
      <Typography variant="bodyHl" color="grey500">
        {columnName}
      </Typography>
      <Typography variant="bodyHl" color="grey500">
        {translate('text_6630e3210c13c500cd398e97')}
      </Typography>
    </ItemHeader>
  )
}

export default NetsuiteIntegrationItemHeader

const ItemHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  padding: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
  background-color: ${theme.palette.grey[100]};
`
