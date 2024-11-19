import { FC } from 'react'

import { Skeleton } from '~/components/designSystem'
import { Card } from '~/styles'
import { SkeletonHeader } from '~/styles/mainObjectsForm'

interface LoadingViewProps {
  cardCount: number
}

export const LoadingView: FC<LoadingViewProps> = ({ cardCount }) => {
  const skeletonCards = Array.from({ length: cardCount }, (_, i) => i)

  return (
    <>
      <SkeletonHeader>
        <Skeleton variant="text" className="mb-5 w-70" />
        <Skeleton variant="text" className="mb-4" />
        <Skeleton variant="text" className="w-30" />
      </SkeletonHeader>
      {skeletonCards.map((skeletonCard) => (
        <Card key={`skeleton-${skeletonCard}`}>
          <Skeleton variant="text" className="mb-9 w-70" />
          <Skeleton variant="text" className="mb-9 w-70" />
          <Skeleton variant="text" className="mb-9 w-70" />
          <Skeleton variant="text" className="mb-4" />
          <Skeleton variant="text" className="w-30" />
        </Card>
      ))}
    </>
  )
}
