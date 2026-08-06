import { ApolloError } from '@apollo/client'
import { useEffect } from 'react'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UseAlertFormLeaveGuardsParams = {
  isEdition: boolean
  alertLoading: boolean
  alertError?: ApolloError
  onLeave: (options?: { replace?: boolean }) => void
}

type UseAlertFormLeaveGuardsReturn = {
  openDirtyAttributesWarning: () => void
}

/**
 * The two leave paths shared by the wallet and subscription alert forms: the
 * dirty-form confirmation dialog, and the redirect to the alerts list when the
 * edited alert is not found (e.g., deleted while on the edit page).
 */
export const useAlertFormLeaveGuards = ({
  isEdition,
  alertLoading,
  alertError,
  onLeave,
}: UseAlertFormLeaveGuardsParams): UseAlertFormLeaveGuardsReturn => {
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()

  const openDirtyAttributesWarning = () =>
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_1746623860224gh7o1exyjch'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => onLeave(),
    })

  useEffect(() => {
    if (isEdition && !alertLoading && hasDefinedGQLError('NotFound', alertError)) {
      addToast({
        severity: 'info',
        translateKey: 'text_1737477631498hwm4np3kbnd',
      })
      // Use replace to prevent back button from returning to this deleted alert page
      onLeave({ replace: true })
    }
  }, [isEdition, alertLoading, alertError, onLeave])

  return { openDirtyAttributesWarning }
}
