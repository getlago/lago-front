import { ComboBox } from '~/components/form'
import { AdminFeatureTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

// Admin-only, English-only labels (the whole admin panel is not translated)
const FEATURE_TYPE_LABELS: Record<AdminFeatureTypeEnum, string> = {
  [AdminFeatureTypeEnum.PremiumIntegration]: 'Premium integration',
  [AdminFeatureTypeEnum.FeatureFlag]: 'Feature flag',
  [AdminFeatureTypeEnum.Organization]: 'Organization',
}

type FiltersItemFeatureTypeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemFeatureType = ({ value, setFilterValue }: FiltersItemFeatureTypeProps) => {
  const { translate } = useInternationalization()

  return (
    <ComboBox
      disableClearable
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(AdminFeatureTypeEnum).map((type) => ({
        value: type,
        label: FEATURE_TYPE_LABELS[type],
      }))}
      onChange={setFilterValue}
      value={value}
    />
  )
}
