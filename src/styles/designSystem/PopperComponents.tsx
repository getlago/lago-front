import { FC, PropsWithChildren } from 'react'

import { tw } from '~/styles/utils'

export const MenuPopper: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={tw('flex flex-col gap-1 p-2', className)}>{children}</div>

export const PopperOpener: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return <div className={tw('absolute right-12 top-4 z-[1] md:right-4', className)}>{children}</div>
}
