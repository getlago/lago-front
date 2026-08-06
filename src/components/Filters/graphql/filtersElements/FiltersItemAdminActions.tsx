import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { AdminActionEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// Admin-only, English-only labels (the whole admin panel is not translated)
const ACTION_LABELS: Record<AdminActionEnum, string> = {
  [AdminActionEnum.ToggleOn]: 'Toggle on',
  [AdminActionEnum.ToggleOff]: 'Toggle off',
  [AdminActionEnum.OrgCreated]: 'Org created',
  [AdminActionEnum.Rollback]: 'Rollback',
}

type FiltersItemAdminActionsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemAdminActions = ({
  value,
  setFilterValue,
}: FiltersItemAdminActionsProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={Object.values(AdminActionEnum).map((action) => ({
        value: action,
        label: ACTION_LABELS[action],
      }))}
      onChange={(actions) => {
        setFilterValue(String(actions.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v, label: ACTION_LABELS[v as AdminActionEnum] ?? v }))}
    />
  )
}
