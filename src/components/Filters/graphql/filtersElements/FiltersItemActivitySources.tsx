import { useFilters } from '~/components/Filters/graphql/useFilters'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { ActivitySourceEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemActivitySourcesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemActivitySources = ({
  value,
  setFilterValue,
}: FiltersItemActivitySourcesProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(ActivitySourceEnum).map((source) => ({
        value: source,
        label: source,
      }))}
      onChange={(sources) => {
        setFilterValue(String(sources.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
