import { Typography } from '~/components/designSystem'
import { TabButton } from '~/components/form/ButtonSelector/TabButton'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export enum WalletTransactionType {
  PrepaidCredits,
  FreeCredits,
}

type TopUpTypeSelectorType = {
  selectedType: WalletTransactionType
  setSelectedType: (type: WalletTransactionType) => void
}

const TopUpTypeSelector = ({ selectedType, setSelectedType }: TopUpTypeSelectorType) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Typography variant="captionHl" color="textSecondary">
          {translate('text_1770383112227gm3k5bztfzw')}
        </Typography>
        <Typography variant="caption">{translate('text_1770383112227nmtea06fshl')}</Typography>
      </div>

      <div className="flex gap-3">
        <TabButton
          active={selectedType === WalletTransactionType.PrepaidCredits}
          onClick={() => setSelectedType(WalletTransactionType.PrepaidCredits)}
          title={translate('text_17703766701142mxy87fquqn')}
        />

        <TabButton
          active={selectedType === WalletTransactionType.FreeCredits}
          onClick={() => setSelectedType(WalletTransactionType.FreeCredits)}
          title={translate('text_1770376670114piyn9eibuhm')}
        />
      </div>
    </div>
  )
}

export default TopUpTypeSelector
