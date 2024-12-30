import { FC, PropsWithChildren } from 'react'

import { Typography } from '~/components/designSystem'
import Logo from '~/public/images/logo/lago-logo.svg'

import { tw } from './utils'

export const Page: FC<PropsWithChildren> = ({ children }) => (
  <div className="min-h-full bg-grey-100 px-4 py-20 md:p-20">{children}</div>
)

export const StyledLogo: FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Logo className="mb-12" {...props} />
)

export const Card: FC<
  PropsWithChildren & {
    className?: string
  }
> = ({ children, className, ...props }) => (
  <div className={tw('mx-auto max-w-144 rounded-xl bg-white p-10 shadow-md', className)} {...props}>
    {children}
  </div>
)

export const Title: FC<PropsWithChildren> = ({ children }) => (
  <Typography className="mb-3" variant="headline">
    {children}
  </Typography>
)

export const Subtitle: FC<PropsWithChildren<{ noMargins?: boolean }>> = ({
  children,
  noMargins,
}) => <Typography className={tw('mb-8', { '!mb-0': !!noMargins })}>{children}</Typography>
