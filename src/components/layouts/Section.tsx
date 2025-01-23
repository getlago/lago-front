import { Skeleton, Typography } from '@mui/material'

import { Button } from '~/components/designSystem'
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
    <div className={tw('mb-4 flex items-center justify-between gap-2', className)}>
      {loading && (
        <div className="flex h-7 w-full items-center">
          <Skeleton variant="text" className="w-40" />
        </div>
      )}

      {!loading && (
        <>
          <div className="flex flex-col gap-2">
            <Typography className={'text-lg font-semibold leading-6 text-grey-700'}>
              {title}
            </Typography>

            {subtitle && (
              <Typography className={'text-sm font-normal text-grey-600'}>{subtitle}</Typography>
            )}
          </div>

          {action && (
            <Button variant="quaternary" onClick={action.onClick} data-test={action.dataTest || ''}>
              {action.title}
            </Button>
          )}

          {customAction ? customAction : null}
        </>
      )}
    </div>
  )
}
