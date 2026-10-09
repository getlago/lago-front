import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { ComboBoxProps } from '~/components/form'
import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { stringifyOptionValue } from './stringifyOptionValue'
import { useXeroIntegrationMappingCRUD } from './useXeroIntegrationMappingCRUD'
import { xeroMappingDefaultValues } from './validationSchema'

type XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: string
  formType: MappingTypeEnum | MappableTypeEnum | undefined
  integrationId: string | undefined
}

const defaultProps: XeroIntegrationMapItemFormWrapperProps = {
  billingEntityKey: '',
  formType: undefined,
  integrationId: undefined,
}

export const XeroIntegrationMapItemFormWrapper = withForm({
  defaultValues: xeroMappingDefaultValues,
  props: defaultProps,
  render: function XeroIntegrationMapItemFormWrapperRender({
    form,
    billingEntityKey,
    formType,
    integrationId,
  }) {
    const { translate } = useInternationalization()

    const {
      getXeroIntegrationItems,
      initialItemFetchLoading,
      initialItemFetchData,
      accountItemsLoading,
      itemsLoading,
      triggerAccountItemRefetch,
      triggerItemRefetch,
    } = useXeroIntegrationMappingCRUD(formType, integrationId)

    const isLoading = initialItemFetchLoading || itemsLoading || accountItemsLoading

    const comboboxData = useMemo(() => {
      return (initialItemFetchData?.integrationItems?.collection || []).map((item) => {
        const { externalId, externalName, externalAccountCode } = item

        return {
          label: `${externalName} (${externalAccountCode})`,
          description: externalId,
          value: stringifyOptionValue({
            externalId,
            externalName: externalName || '',
            externalAccountCode: externalAccountCode || '',
          }),
        }
      })
    }, [initialItemFetchData?.integrationItems?.collection])

    const isAccountContext = formType === MappingTypeEnum.Account

    const searchQuery = !!integrationId
      ? (getXeroIntegrationItems as unknown as ComboBoxProps['searchQuery'])
      : undefined

    const helperText =
      !isLoading && !comboboxData.length ? translate('text_6630ec823adac97d3bf0fb4b') : undefined

    const handleRefresh = () => {
      if (isAccountContext) {
        triggerAccountItemRefetch()
        return
      }

      triggerItemRefetch()
    }

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
          onClick={handleRefresh}
        />
      </div>
    )
  },
})
