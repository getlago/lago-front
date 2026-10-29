import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData } from '~/components/form'
import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { extractOptionValue } from './extractOptionValue'
import { toXeroOption } from './toXeroOption'
import { useXeroIntegrationItemSearch } from './useXeroIntegrationItems'
import { xeroMappingDefaultValues } from './validationSchema'

type XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: string
  items: BasicComboBoxData[]
  isLoading: boolean
  formType: MappingTypeEnum | MappableTypeEnum | undefined
  integrationId: string | undefined
  onRefresh: () => void
}

const defaultProps: XeroIntegrationMapItemFormWrapperProps = {
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
): BasicComboBoxData[] => {
  if (!selectedValue || comboboxData.some(({ value }) => value === selectedValue)) {
    return comboboxData
  }

  const { externalId, externalName, externalAccountCode } = extractOptionValue(selectedValue)

  return [
    ...comboboxData,
    toXeroOption({ externalId: externalId ?? '', externalName, externalAccountCode }),
  ]
}

export const XeroIntegrationMapItemFormWrapper = withForm({
  defaultValues: xeroMappingDefaultValues,
  props: defaultProps,
  render: function XeroIntegrationMapItemFormWrapperRender({
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
    } = useXeroIntegrationItemSearch(formType, integrationId)

    const selectedValue = useStore(
      form.store,
      (state) => state.values[billingEntityKey]?.selectedElementValue,
    )

    const isBusy = isLoading || isSearchLoading
    const comboboxData = useMemo(
      () => withSelectedOption(isSearching ? searchResults : items, selectedValue),
      [isSearching, searchResults, items, selectedValue],
    )

    const helperText =
      !isBusy && !comboboxData.length ? translate('text_6630ec823adac97d3bf0fb4b') : undefined

    return (
      <div className="mb-8 flex flex-row gap-3">
        <div className="flex-1">
          <form.AppField name={`${billingEntityKey}.selectedElementValue`}>
            {(field) => (
              <field.ComboBoxField
                data={comboboxData}
                loading={isBusy}
                label={translate('text_6672ebb8b1b50be550eccb73')}
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
