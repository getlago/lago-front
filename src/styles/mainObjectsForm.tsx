import { FC, PropsWithChildren } from 'react'

import { Skeleton, Typography, TypographyProps } from '~/components/designSystem'

import { tw } from './utils'

export const Main = ({ children }: PropsWithChildren) => (
  <div className="w-full px-4 pt-12 md:w-3/5 md:p-12 md:pb-0 [&>div>*:not(:last-child)]:mb-8 [&>div]:max-w-180">
    {children}
  </div>
)

export const Side = ({ children }: PropsWithChildren) => (
  <div className="height-minus-nav sticky right-0 top-nav hidden w-2/5 bg-grey-100 md:block">
    {children}
  </div>
)

export const Title: FC<PropsWithChildren<TypographyProps>> = ({
  children,
  className,
  ...props
}) => (
  <Typography className={tw('mb-1 px-8', className)} {...props}>
    {children}
  </Typography>
)

export const Subtitle: FC<PropsWithChildren<TypographyProps>> = ({
  children,
  className,
  ...props
}) => (
  <Typography className={tw('mb-8 px-8', className)} {...props}>
    {children}
  </Typography>
)

// ------------------------------------------------------------

export const FormLoadingSkeleton = ({ id, length = 2 }: { id: string; length?: number }) => {
  const array = Array.from({ length }, (_, index) => index)

  return (
    <>
      <div className="flex flex-col gap-1">
        <Skeleton className="w-40" variant="text" textVariant="headline" />
        <Skeleton className="w-100" variant="text" />
      </div>
      {array.map((_, index) => (
        <div key={`${id}-${index}`}>
          <div className="flex flex-col gap-1 pb-12 shadow-b">
            <Skeleton variant="text" className="w-40" />
            <Skeleton variant="text" className="w-100" />
            <Skeleton variant="text" className="w-74" />
          </div>
        </div>
      ))}
    </>
  )
}
