import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem } from '~/components/form/ComboBox/ComboBoxItem'

export const OPTIONS_PAGE_SIZE = 50

export type ContractComboboxOption = { label: string; labelNode: JSX.Element; value: string }

export const buildComboboxOption = (
  label: string,
  caption: string,
  value: string,
): ContractComboboxOption => ({
  label,
  labelNode: (
    <ComboboxItem>
      <Typography variant="body" color="grey700" noWrap>
        {label}
      </Typography>
      <Typography variant="caption" color="grey600" noWrap>
        {caption}
      </Typography>
    </ComboboxItem>
  ),
  value,
})

export const mergeSeededOption = (
  seed: ContractComboboxOption | undefined,
  options: ContractComboboxOption[],
): ContractComboboxOption[] => {
  if (!seed) return options

  return [seed, ...options.filter((option) => option.value !== seed.value)]
}
