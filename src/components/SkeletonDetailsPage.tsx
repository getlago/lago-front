import styled from 'styled-components'

import { NAV_HEIGHT, theme } from '~/styles'

import { Skeleton } from './designSystem'

const SkeletonDetailsPage = () => {
  return (
    <div>
      <SkeletonHeader>
        <Skeleton variant="text" width={312} height={12} />
      </SkeletonHeader>
      <SkeletonBody>
        <SkeletonBodyFirst>
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="text" width={200} height={12} />
        </SkeletonBodyFirst>
        <SkeletonBodySecond>
          <SkeletonBodyFirst>
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="text" width={200} height={12} />
          </SkeletonBodyFirst>
          <SkeletonBodyFirst>
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="text" width={200} height={12} />
          </SkeletonBodyFirst>
        </SkeletonBodySecond>
      </SkeletonBody>
    </div>
  )
}

export default SkeletonDetailsPage

const SkeletonHeader = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
`

const SkeletonBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
`

const SkeletonBodyFirst = styled.div`
  width: 100%;
  padding: ${theme.spacing(1)} 0 ${theme.spacing(2)} 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
`

const SkeletonBodySecond = styled.div`
  width: 100%;
  padding: ${theme.spacing(1)} 0 ${theme.spacing(2)} 0;
  box-sizing: border-box;
  display: flex;
  gap: ${theme.spacing(4)};
`
