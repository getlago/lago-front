import { Button, Skeleton, Typography } from 'lago-design-system'

import { tw } from '~/styles/utils'

export const PageSectionTitle = ({
  className,
  title,
  subtitle,
  action,
  customAction,
  loading,
}: {
  className?: string
  title: string
  subtitle?: string
  action?: { title: string; onClick: () => void; dataTest?: string }
  customAction?: React.ReactNode
  loading?: boolean
}) => {
  return (
    <div className={tw('mb-4 flex items-baseline justify-between gap-2', className)}>
      {loading && (
        <div className="flex h-7 w-full items-baseline">
          <Skeleton variant="text" className="w-40" />
        </div>
      )}

      {!loading && (
        <>
          <div className="flex flex-col gap-2">
            <Typography variant="subhead1" color="grey700">
              {title}
            </Typography>

            {subtitle && (
              <Typography variant="body" color="grey600">
                {subtitle}
              </Typography>
            )}
          </div>

          {action && (
            <Button variant="inline" onClick={action.onClick} data-test={action.dataTest || ''}>
              {action.title}
            </Button>
          )}

          {!!customAction && customAction}
        </>
      )}
    </div>
  )
}
