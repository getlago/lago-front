import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

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
                data={comboboxData}
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
