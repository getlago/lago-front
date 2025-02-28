import { FC, PropsWithChildren } from 'react'

import { tw } from '~/styles/utils'

export const MenuPopper: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={tw('flex flex-col gap-1 p-2', className)}>{children}</div>
