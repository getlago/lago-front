import { FC } from 'react'
import styled from 'styled-components'

import { Avatar, Icon, IconName, Skeleton, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

interface DetailsHeaderProps {
  icon: IconName
  title: string
  description: string
}
export const DetailsHeader: FC<DetailsHeaderProps> = ({ icon, title, description }) => {
  return (
    <HeaderWrapper>
      <Avatar variant="connector" size="large">
        <Icon name={icon} color="dark" size="large" />
      </Avatar>

      <HeaderDetailsWrapper>
        <>
          <Typography variant="headline" color="grey700" noWrap>
            {title}
          </Typography>
          <Typography variant="body" color="grey600" noWrap>
            {description}
          </Typography>
        </>
      </HeaderDetailsWrapper>
    </HeaderWrapper>
  )
}

export const DetailsHeaderSkeleton = () => {
  return (
    <HeaderWrapper>
      <Skeleton variant="connectorAvatar" size="large" />

      <HeaderDetailsWrapper>
        <LoadingWrapper>
          <Skeleton variant="text" width={200} marginBottom={20} />
          <Skeleton variant="text" width={200} />
        </LoadingWrapper>
      </HeaderDetailsWrapper>
    </HeaderWrapper>
  )
}

const HeaderWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  align-items: center;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
  box-shadow: ${theme.shadows[7]};
`

const HeaderDetailsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(1)};
  /* Used to hide text overflow */
  overflow: hidden;
`
const LoadingWrapper = styled.div`
  width: 200px;
`
