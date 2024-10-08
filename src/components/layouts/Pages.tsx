import { PropsWithChildren } from 'react'

export const PageBannerHeader = ({ children }: PropsWithChildren) => {
  return (
    <div className="sticky top-0 z-navBar flex min-h-18 flex-row items-center justify-between gap-2 bg-white px-17 py-4 shadow-b md:px-12">
      {children}
    </div>
  )
}
