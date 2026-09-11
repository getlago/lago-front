import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { EDIT_QUOTE_ROUTE, VOID_QUOTE_ROUTE } from '~/core/router'
import { StatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useApproveQuote } from './useApproveQuote'
import { useCloneQuote } from './useCloneQuote'

export type QuoteVersionAction = {
  icon: IconName
  label: string
} & ({ onAction: () => void; link?: never } | { link: () => string; onAction?: never })

interface QuoteInfo {
  id: string
  number: string
  versions: Array<{ id: string; status: StatusEnum; version: number }>
}

interface VersionInfo {
  id: string
  status: StatusEnum
  version: number
}

export const useQuoteVersionActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { goToApproveQuote } = useApproveQuote()
  const { openCloneDialog } = useCloneQuote()

  const getActions = (quote: QuoteInfo, version?: VersionInfo): QuoteVersionAction[] => {
    const { id, number } = quote
    const targetVersion = version ?? quote.versions[0]

    if (!targetVersion) return []

    // If the latest version is approved, no actions are available on any version
    if (quote.versions[0]?.status === StatusEnum.Approved) return []

    const { id: versionId, status, version: versionNumber } = targetVersion

    const actions: QuoteVersionAction[] = []

    if (status === StatusEnum.Draft) {
      if (hasPermissions(['quotesApprove'])) {
        actions.push({
          icon: 'validate-unfilled',
          label: translate('text_1776414006125k6n9d1baloi'),
          onAction: () => goToApproveQuote(id, versionId),
        })
      }

      if (hasPermissions(['quotesUpdate'])) {
        actions.push({
          icon: 'pen',
          label: translate('text_17764140061256c7yby4p5ze'),
          link: () => generatePath(EDIT_QUOTE_ROUTE, { quoteId: id, versionId }),
        })
      }

      if (hasPermissions(['quotesVoid'])) {
        actions.push({
          icon: 'stop',
          label: translate('text_1776414006125xh19d6399qv'),
          link: () => generatePath(VOID_QUOTE_ROUTE, { quoteId: id, versionId }),
        })
      }
    }

    if (hasPermissions(['quotesClone'])) {
      actions.push({
        icon: 'duplicate',
        label: translate('text_17764140061251m8snap6nft'),
        onAction: () => openCloneDialog(versionId, `${number} - v${versionNumber}`),
      })
    }

    return actions
  }

  return { getActions }
}
