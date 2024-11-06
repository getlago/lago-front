import { PropsWithChildren } from 'react'

import { Skeleton } from './designSystem'

const SkeletonDetailsPage = () => {
  return (
    <div>
      <div className="flex h-18 items-center">
        <Skeleton className="w-78" variant="text" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div className="flex flex-col gap-3 pb-3 pt-1" key={`skeleton-details-page-${i}`}>
            {i !== 1 && (
              <>
                <Skeleton className="w-20" variant="text" />
                <Skeleton className="w-50" variant="text" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonDetailsPage

export const LoadingSkeletonWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-12">{children}</div>
)
