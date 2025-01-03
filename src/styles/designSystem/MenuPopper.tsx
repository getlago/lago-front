import { FC, PropsWithChildren } from 'react'

export const MenuPopper: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex flex-col gap-1 p-2">{children}</div>
)
