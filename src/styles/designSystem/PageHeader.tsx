import { FC, PropsWithChildren } from 'react'

import { tw } from '../utils'

export const PageHeader: FC<PropsWithChildren<{ withSide?: boolean; className?: string }>> = ({
  children,
  className,
  withSide,
}) => (
  <div
    className={tw(
      'sticky top-0 z-navBar flex h-18 min-h-18 items-center justify-between bg-white shadow-b md:px-12',
      {
        'pl-17 pr-4': withSide,
        'py-4': !withSide,
      },
      className,
    )}
  >
    {children}
  </div>
)
