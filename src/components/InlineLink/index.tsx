import { FC, PropsWithChildren } from 'react'
import { Link, LinkProps } from 'react-router-dom'

const InlineLink: FC<PropsWithChildren<LinkProps>> = ({ children, ...props }) => {
  return (
    <Link
      className="flex w-fit flex-row !shadow-none line-break-anywhere before:px-1 before:text-grey-700 before:content-['•'] hover:no-underline focus:ring-0"
      {...props}
    >
      {children}
    </Link>
  )
}

export { InlineLink }
