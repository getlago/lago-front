import { ReactNode } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { NAV_HEIGHT, theme } from '~/styles'

export const DetailsInfoItem = ({ label, value }: { label: string; value: ReactNode | string }) => {
  return (
    <div>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="body" color="grey700">
        {value}
      </Typography>
    </div>
  )
}

export const DetailsSectionTitle = styled(Typography)`
  display: flex;
  align-items: center;
  height: ${NAV_HEIGHT}px;
`

export const DetailsInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(auto, 1fr));
  gap: ${theme.spacing(4)} ${theme.spacing(8)};
`

export const DetailsAccordionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
`
