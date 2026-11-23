import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData } from '~/components/form'
import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { extractOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/extractOptionValue'

import { toQuickbooksOption } from './toQuickbooksOption'
import { useQuickbooksIntegrationItemSearch } from './useQuickbooksIntegrationItems'
import { quickbooksMappingDefaultValues } from './validationSchema'

type QuickbooksIntegrationMapItemFormWrapperProps = {
  billingEntityKey: string
  items: BasicComboBoxData[]
  isLoading: boolean
  formType: MappingTypeEnum | MappableTypeEnum | undefined
  integrationId: string | undefined
  onRefresh: () => void
}

const defaultProps: QuickbooksIntegrationMapItemFormWrapperProps = {
  billingEntityKey: '',
  items: [],
  isLoading: false,
  formType: undefined,
  integrationId: undefined,
  onRefresh: () => {},
}

// `ComboBox` clears its field when the selected option leaves `data`, so the mapping already
// stored stays in the list even when a search, or the 1000-item cap, does not return it.
const withSelectedOption = (
  comboboxData: BasicComboBoxData[],
  selectedValue: string | undefined,
  isSearching: boolean,
): BasicComboBoxData[] => {
  if (!selectedValue || comboboxData.some(({ value }) => value === selectedValue)) {
    return comboboxData
  }

  const { externalId, externalName } = extractOptionValue(selectedValue)

  return [
    ...comboboxData,
    {
      ...toQuickbooksOption({ externalId: externalId ?? '', externalName }),
      hidden: isSearching,
    },
  ]
}

export const QuickbooksIntegrationMapItemFormWrapper = withForm({
  defaultValues: quickbooksMappingDefaultValues,
  props: defaultProps,
  render: function QuickbooksIntegrationMapItemFormWrapperRender({
    form,
    billingEntityKey,
    items,
    isLoading,
    formType,
    integrationId,
    onRefresh,
  }) {
    const { translate } = useInternationalization()
    const {
      searchResults,
      isSearching,
      isLoading: isSearchLoading,
      search,
    } = useQuickbooksIntegrationItemSearch(formType, integrationId)

    const selectedValue = useStore(
      form.store,
      (state) => state.values[billingEntityKey]?.selectedElementValue,
    )

    const isBusy = isLoading || isSearchLoading
    const comboboxData = useMemo(
      () => withSelectedOption(isSearching ? searchResults : items, selectedValue, isSearching),
      [isSearching, searchResults, items, selectedValue],
    )

    const hasListedOption = comboboxData.some(({ hidden }) => !hidden)
    const helperText =
      !isBusy && !hasListedOption ? translate('text_6630ec823adac97d3bf0fb4b') : undefined

    return (
      <div className="mb-8 flex flex-row gap-3">
        <div className="flex-1">
          <form.AppField name={`${billingEntityKey}.selectedElementValue`}>
            {(field) => (
              <field.ComboBoxField
                data={comboboxData}
                loading={isBusy}
                label={translate('text_17954348915427eym1cdesug')}
                placeholder={translate('text_6630e51df0a194013daea622')}
                helperText={helperText}
                searchQuery={search}
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
          disabled={isBusy}
          loading={isBusy}
          onClick={onRefresh}
        />
      </div>
    )
  },
})
