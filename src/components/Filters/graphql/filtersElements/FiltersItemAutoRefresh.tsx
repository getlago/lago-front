import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { ComboBox } from '~/components/form'
import {
  AUTO_REFRESH_OPTIONS,
  AUTO_REFRESH_TRANSLATIONS,
} from '~/components/realtimeUsage/constants'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemAutoRefreshProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemAutoRefresh = ({
  value,
  setFilterValue,
}: FiltersItemAutoRefreshProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <ComboBox
      disableClearable
      sortValues={false}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={AUTO_REFRESH_OPTIONS.map((seconds) => ({
        value: String(seconds),
        label: translate(AUTO_REFRESH_TRANSLATIONS[seconds]),
      }))}
      onChange={setFilterValue}
      value={value}
    />
  )
}
