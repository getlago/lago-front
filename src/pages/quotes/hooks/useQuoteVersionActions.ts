import { IconName } from 'lago-design-system'

import { QuoteListItemFragment, StatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useApproveQuote } from './useApproveQuote'
import { useCloneQuote } from './useCloneQuote'
import { useEditQuote } from './useEditQuote'
import { useVoidQuote } from './useVoidQuote'

export interface QuoteVersionAction {
  icon: IconName
  label: string
  onAction: () => void
}

export const useQuoteVersionActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { approveQuote } = useApproveQuote()
  const { editQuote } = useEditQuote()
  const { voidQuote } = useVoidQuote()
  const { openCloneDialog } = useCloneQuote()

  const getActions = (version: QuoteListItemFragment): QuoteVersionAction[] => {
    const { id, status, number, version: versionNumber } = version

    if (status === StatusEnum.Approved) return []

    const actions: QuoteVersionAction[] = []

    if (status === StatusEnum.Draft) {
      if (hasPermissions(['quotesApprove'])) {
        actions.push({
          icon: 'checkmark',
          label: translate('text_1776414006125k6n9d1baloi'),
          onAction: () => approveQuote(id),
        })
      }

      if (hasPermissions(['quotesUpdate'])) {
        actions.push({
          icon: 'pen',
          label: translate('text_17764140061256c7yby4p5ze'),
          onAction: () => editQuote(id),
        })
      }

      if (hasPermissions(['quotesVoid'])) {
        actions.push({
          icon: 'stop',
          label: translate('text_1776414006125xh19d6399qv'),
          onAction: () => voidQuote(id),
        })
      }
    }

    if (hasPermissions(['quotesClone'])) {
      actions.push({
        icon: 'duplicate',
        label: translate('text_17764140061251m8snap6nft'),
        onAction: () => openCloneDialog(id, `${number} - v${versionNumber}`),
      })
    }

    return actions
  }

  return { getActions }
}
