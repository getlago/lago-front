import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { extractOptionValue } from './extractOptionValue'
import { xeroMappingDefaultValues } from './validationSchema'

type XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: string
  comboboxData: BasicComboBoxData[]
  isLoading: boolean
  searchQuery: ComboBoxProps['searchQuery']
  onRefresh: () => void
}

const defaultProps: XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: '',
  comboboxData: [],
  isLoading: false,
  searchQuery: undefined,
  onRefresh: () => {},
}

// The item list is shared by every billing entity, so a search narrows it for all of them.
// `ComboBox` clears its field when the selected option leaves `data`, which would wipe the
// mappings the user is not searching in.
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
    comboboxData,
    isLoading,
    searchQuery,
    onRefresh,
  }) {
    const { translate } = useInternationalization()

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
