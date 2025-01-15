import { FC, PropsWithChildren } from 'react'

import { tw } from '../utils'

/**
 * Page Header - Main Wrapper
 * @param withSide - If true, adds padding to the left and right for burger menu
 */
const PageHeaderWrapper: FC<PropsWithChildren<{ withSide?: boolean; className?: string }>> = ({
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

/**
 * Page Header - Section group inside main wrapper
 */
const PageHeaderGroup: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => <div className={tw('flex items-center gap-3', className)}>{children}</div>

export const PageHeader = {
  Wrapper: PageHeaderWrapper,
  Group: PageHeaderGroup,
}
