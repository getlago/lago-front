import { FC } from 'react'
import styled from 'styled-components'

import { Avatar, Icon, IconName, Skeleton, Typography } from '~/components/designSystem'
import { NAV_HEIGHT, theme } from '~/styles'

interface PropertyListItemProps {
  label: string
  value: string
  icon: IconName
}

export const PropertyListItem: FC<PropertyListItemProps> = ({ label, value, icon }) => {
  return (
    <Container>
      <Avatar variant="connector" size="big">
        <Icon name={icon} color="dark" />
      </Avatar>
      <div>
        <Typography variant="caption" color="grey600">
          {label}
        </Typography>
        <Typography variant="body" color="grey700">
          {value}
        </Typography>
      </div>
    </Container>
  )
}

export const SkeletonPropertyListItem: FC = () => {
  return (
    <Container>
      <Skeleton variant="connectorAvatar" size="big" className="mr-4" />
      <SkeletonText>
        <Skeleton variant="text" className="mb-3 w-75" />
        <Skeleton variant="text" className="w-60" />
      </SkeletonText>
    </Container>
  )
}

const Container = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const SkeletonText = styled.div`
  width: 100%;
`
