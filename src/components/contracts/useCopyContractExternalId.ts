import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useCopyContractExternalId = () => {
  const { translate } = useInternationalization()

  const copyContractExternalId = (externalId: string) => {
    copyToClipboard(externalId)
    addToast({
      severity: 'info',
      translateKey: 'text_1789636691484fyt51yyc9uh',
    })
  }

  return {
    copyContractExternalId,
    copyContractExternalIdLabel: translate('text_1789636691484c9hodzevcvd'),
  }
}
