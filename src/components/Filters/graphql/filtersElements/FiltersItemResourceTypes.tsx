import { useFilters } from '~/components/Filters/graphql/useFilters'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { ResourceTypeEnum } from '~/generated/graphql'
import { useActivityLogsInformation } from '~/hooks/activityLogs/useActivityLogsInformation'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FiltersItemResourceTypesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemResourceTypes = ({
  value,
  setFilterValue,
}: FiltersItemResourceTypesProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()
  const { getResourceType } = useActivityLogsInformation()
  const resourceTypes = Object.entries(ResourceTypeEnum).map(([resourceTypeName, resourceType]) => ({
    label: getResourceType(resourceTypeName),
    value: resourceType,
  }))

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={resourceTypes}
      onChange={(invoiceType) => {
        setFilterValue(String(invoiceType.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => resourceTypes.find(({ value: resourceType }) => resourceType === v) ?? { value: v })}
    />
  )
}
