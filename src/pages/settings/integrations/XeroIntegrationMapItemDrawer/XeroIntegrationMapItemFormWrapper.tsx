import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { extractOptionValue } from './extractOptionValue'
import { xeroMappingDefaultValues } from './validationSchema'

type XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: string
  items: BasicComboBoxData[]
  searchResults: BasicComboBoxData[]
  isSearching: boolean
  isLoading: boolean
  search: ComboBoxProps['searchQuery']
  onSearch: (billingEntityKey: string, searchTerm: string | undefined) => void
  onRefresh: () => void
}

const defaultProps: XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: '',
  items: [],
  searchResults: [],
  isSearching: false,
  isLoading: false,
  search: undefined,
  onSearch: () => {},
  onRefresh: () => {},
}

// `ComboBox` clears its field when the selected option leaves `data`, so the mapping already
// stored stays in the list even when a search, or the 1000-item cap, does not return it.
const withSelectedOption = (
  comboboxData: BasicComboBoxData[],
  selectedValue: string | undefined,
): BasicComboBoxData[] => {
  if (!selectedValue || comboboxData.some(({ value }) => value === selectedValue)) {
    return comboboxData
  }

  const { externalId, externalName, externalAccountCode } = extractOptionValue(selectedValue)

  return [
    ...comboboxData,
    {
      label: `${externalName} (${externalAccountCode})`,
      description: externalId,
      value: selectedValue,
    },
  ]
}

export const XeroIntegrationMapItemFormWrapper = withForm({
  defaultValues: xeroMappingDefaultValues,
  props: defaultProps,
  render: function XeroIntegrationMapItemFormWrapperRender({
    form,
    billingEntityKey,
    items,
    searchResults,
    isSearching,
    isLoading,
    search,
    onSearch,
    onRefresh,
  }) {
    const { translate } = useInternationalization()

    // The search query is shared by every billing entity, so the drawer tracks which field is
    // searching; the others keep showing the unfiltered list.
    const searchQuery = search
      ? (((...args: Parameters<NonNullable<ComboBoxProps['searchQuery']>>) => {
          onSearch(billingEntityKey, args[0]?.variables?.searchTerm ?? undefined)

          return search(...args)
        }) as ComboBoxProps['searchQuery'])
      : undefined

    const comboboxData = isSearching ? searchResults : items

    const helperText =
      !isLoading && !comboboxData.length ? translate('text_6630ec823adac97d3bf0fb4b') : undefined

    return (
      <div className="mb-8 flex flex-row gap-3">
        <div className="flex-1">
          <form.AppField name={`${billingEntityKey}.selectedElementValue`}>
            {(field) => (
              <field.ComboBoxField
                data={withSelectedOption(comboboxData, field.state.value as string | undefined)}
                loading={isLoading}
                label={translate('text_6672ebb8b1b50be550eccb73')}
                placeholder={translate('text_6630e51df0a194013daea622')}
                helperText={helperText}
                searchQuery={searchQuery}
                fetchOnMount={false}
                PopperProps={{ displayInDialog: true }}
              />
            )}
          </form.AppField>
        </div>
        <Button
          className="mt-8"
          icon="reload"
          variant="quaternary"
          disabled={isLoading}
          loading={isLoading}
          onClick={onRefresh}
        />
      </div>
    )
  },
})
