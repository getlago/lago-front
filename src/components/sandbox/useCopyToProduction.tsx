import { gql, useApolloClient } from '@apollo/client'
import { useRef } from 'react'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useCopyToProductionMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { useSandbox } from '~/hooks/useSandbox'

import {
  CopyToProductionTarget,
  getItemTypeKey,
  getRefusalFromErrors,
  getRefusalKey,
  isTargetNotFound,
  NamedItem,
} from './copyToProductionErrors'

gql`
  mutation copyToProduction($input: CopyToProductionInput!) {
    copyToProduction(input: $input) {
      id
      code
    }
  }
`

export const COPY_TO_PRODUCTION_ACTION_TEST_ID = 'copy-to-production-action'

const TITLE_TRANSLATION_KEY = 'text_1795431906433rcppnbh5k88'
const DESCRIPTION_TRANSLATION_KEY = 'text_1795431906433hmboas9jg4e'
const ACTION_TRANSLATION_KEY = 'text_17957683665190k45li34638'
const SUCCESS_TRANSLATION_KEY = 'text_1795431906433hn8hins2pus'
const SUCCESS_WITH_LINK_TRANSLATION_KEY = 'text_1795768366519ycewco9f1qj'
const ERROR_TRANSLATION_KEY = 'text_17954319064335ads00pkxh8'
const NOT_FOUND_TRANSLATION_KEY = 'text_1795539325659cdyvy8085m1'

type UseCopyToProduction = () => {
  canCopyToProduction: boolean
  copyToProduction: (target: CopyToProductionTarget) => void
}

export const useCopyToProduction: UseCopyToProduction = () => {
  const { translate } = useInternationalization()
  const { isSandbox, productionPath } = useSandbox()
  const { hasPermissions } = usePermissions()
  const centralizedDialog = useCentralizedDialog()
  const client = useApolloClient()
  const isPendingRef = useRef(false)

  const [copyToProductionMutation] = useCopyToProductionMutation({
    context: { silentError: true },
  })

  const translateItem = (key: string, item: NamedItem): string =>
    translate(key, { itemType: translate(getItemTypeKey(item.itemType)), code: item.code })

  const showError = (): void => {
    addToast({ severity: 'danger', translateKey: ERROR_TRANSLATION_KEY })
  }

  const showNotFound = (): void => {
    addToast({ severity: 'info', translateKey: NOT_FOUND_TRANSLATION_KEY })
    void client.refetchQueries({ include: 'active' })
  }

  const showSuccess = (code: string): void => {
    addToast({
      severity: 'success',
      message: productionPath
        ? translate(SUCCESS_WITH_LINK_TRANSLATION_KEY, { code, href: productionPath })
        : translate(SUCCESS_TRANSLATION_KEY, { code }),
    })
  }

  const runCopy = async (target: CopyToProductionTarget): Promise<void> => {
    const { data, errors } = await copyToProductionMutation({ variables: { input: target } })

    if (isTargetNotFound(target, errors)) return showNotFound()
    if (data?.copyToProduction && !errors?.length) return showSuccess(target.code)

    const refusal = getRefusalFromErrors(errors)

    if (!refusal) return showError()

    const item = refusal.parent ?? { itemType: target.itemType, code: target.code }

    addToast({
      severity: 'info',
      message: translateItem(getRefusalKey(refusal, item.itemType), item),
    })
  }

  const withPendingGuard = async (run: () => Promise<void>): Promise<void> => {
    if (isPendingRef.current) return

    isPendingRef.current = true

    try {
      await run()
    } finally {
      isPendingRef.current = false
    }
  }

  const copyToProduction = (target: CopyToProductionTarget): void => {
    void centralizedDialog.open({
      // Codes have no spaces: a long one breaks anywhere instead of overflowing the dialog.
      title: (
        <span className="[overflow-wrap:anywhere]">
          {translate(TITLE_TRANSLATION_KEY, { code: target.code })}
        </span>
      ),
      description: translate(DESCRIPTION_TRANSLATION_KEY),
      actionText: translate(ACTION_TRANSLATION_KEY),
      cancelOrCloseText: 'cancel',
      closeOnError: false,
      onError: showError,
      onAction: () => withPendingGuard(() => runCopy(target)),
    })
  }

  return {
    canCopyToProduction: isSandbox && hasPermissions(['copyToProductionCreate']),
    copyToProduction,
  }
}
