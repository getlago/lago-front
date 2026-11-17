import { ReactElement } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useSandbox } from '~/hooks/useSandbox'

export const MANAGED_IN_PRODUCTION_ALERT_TEST_ID = 'managed-in-production-alert'

export const ManagedInProductionAlert = ({
  className,
}: {
  className?: string
}): ReactElement | null => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { isSandbox, productionPath } = useSandbox()

  if (!isSandbox) return null

  return (
    <Alert
      type="info"
      className={className}
      data-test={MANAGED_IN_PRODUCTION_ALERT_TEST_ID}
      ButtonProps={
        productionPath
          ? {
              label: translate('text_1794221187063tztk6kvdznf'),
              onClick: () => navigate(productionPath, { skipSlugPrepend: true }),
            }
          : undefined
      }
    >
      {translate('text_17942211870635zfjx3ojmyy')}
    </Alert>
  )
}
