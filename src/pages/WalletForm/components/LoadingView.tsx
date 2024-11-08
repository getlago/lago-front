import { FC } from 'react'

import { Skeleton } from '~/components/designSystem'
import { Card, theme } from '~/styles'
import { SkeletonHeader } from '~/styles/mainObjectsForm'

interface LoadingViewProps {
  cardCount: number
}

export const LoadingView: FC<LoadingViewProps> = ({ cardCount }) => {
  const skeletonCards = Array.from({ length: cardCount }, (_, i) => i)

  return (
    <>
      <SkeletonHeader>
        <Skeleton variant="text" width={280} marginBottom={theme.spacing(5)} />
        <Skeleton variant="text" width="inherit" marginBottom={theme.spacing(4)} />
        <Skeleton variant="text" width={120} />
      </SkeletonHeader>
      {skeletonCards.map((skeletonCard) => (
        <Card key={`skeleton-${skeletonCard}`}>
          <Skeleton variant="text" width={280} marginBottom={theme.spacing(9)} />
          <Skeleton variant="text" width={280} marginBottom={theme.spacing(9)} />
          <Skeleton variant="text" width={280} marginBottom={theme.spacing(9)} />
          <Skeleton variant="text" width="inherit" marginBottom={theme.spacing(4)} />
          <Skeleton variant="text" width={120} />
        </Card>
      ))}
    </>
  )
}
