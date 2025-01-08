import { FC, PropsWithChildren } from 'react'

import { Typography, TypographyProps } from '~/components/designSystem'

import { tw } from './utils'

export const SectionHeader: FC<
  PropsWithChildren<{ hideBottomShadow?: boolean } & TypographyProps>
> = ({ children, hideBottomShadow, className, ...props }) => (
  <Typography
    className={tw(
      'flex h-18 items-center justify-between',
      {
        'shadow-b': !hideBottomShadow,
      },
      className,
    )}
    {...props}
  >
    {children}
  </Typography>
)
