import { PropsWithChildren } from 'react'

import { tw } from '~/styles/utils'

import { Skeleton, Typography } from '../designSystem'

export const SettingsPaddedContainer = ({
  children,
  className,
}: PropsWithChildren & { className?: string }) => (
  <div className={tw('container flex flex-col gap-10 pb-20 pt-8', className)}>{children}</div>
)

export const SettingsPageHeaderContainer = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-1">{children}</div>
)

export const SettingsListWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-8">{children}</div>
)

export const SettingsListItem = ({
  children,
  className,
}: PropsWithChildren & { className?: string }) => (
  <div
    className={tw('flex flex-col gap-4 pb-8 shadow-b last:pb-0 last:[box-shadow:none]', className)}
  >
    {children}
  </div>
)

export const SettingsListItemLoadingSkeleton = ({ count = 1 }: { count?: number }) =>
  Array.from({ length: count }).map((_, index) => (
    <div
      key={`settings-list-item-skeleton-${index}`}
      className="flex w-98 flex-col justify-between pb-8 shadow-b last:pb-0 last:[box-shadow:none]"
    >
      <Skeleton variant="text" width={160} height={12} marginBottom={24} />
      <Skeleton variant="text" width={320} height={12} marginBottom={28} />
      <Skeleton variant="text" width={240} height={12} marginBottom={8} />
    </div>
  ))

export const SettingsListItemHeader = ({
  label,
  sublabel,
  action,
}: {
  label: string
  sublabel?: string
  action?: JSX.Element
}) => (
  <div className="flex min-h-12 flex-row items-center justify-between gap-4">
    <div className="flex flex-col gap-2">
      <Typography variant="subhead" color="grey700">
        {label}
      </Typography>

      {sublabel && <Typography variant="caption">{sublabel}</Typography>}
    </div>

    {!!action && <>{action}</>}
  </div>
)
