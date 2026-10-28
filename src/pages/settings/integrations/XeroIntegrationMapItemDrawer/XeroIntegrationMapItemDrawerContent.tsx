import { ComponentProps } from 'react'

import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  IntegrationMapItemDrawerContent,
  IntegrationMapItemDrawerContentProps,
} from '~/pages/settings/integrations/IntegrationMapItemDrawer'

import { useXeroIntegrationItems } from './useXeroIntegrationItems'
import { XeroIntegrationMapItemFormWrapper } from './XeroIntegrationMapItemFormWrapper'

type XeroIntegrationMapItemDrawerContentProps = Omit<
  IntegrationMapItemDrawerContentProps,
  'renderForm' | 'form'
> & {
  form: ComponentProps<typeof XeroIntegrationMapItemFormWrapper>['form']
  formType: MappingTypeEnum | MappableTypeEnum | undefined
  integrationId: string | undefined
}

// `IntegrationMapItemDrawerContent` unmounts the non-selected billing entity tabs, so an items
// query owned by the form wrapper would refetch — and blank the combobox — on every tab switch.
export const XeroIntegrationMapItemDrawerContent = ({
  formType,
  integrationId,
  form,
  ...contentProps
}: XeroIntegrationMapItemDrawerContentProps): JSX.Element => {
  const { comboboxData, isLoading, searchQuery, refresh } = useXeroIntegrationItems(
    formType,
    integrationId,
  )

  return (
    <IntegrationMapItemDrawerContent
      {...contentProps}
      form={form}
      renderForm={(billingEntityKey) => (
        <XeroIntegrationMapItemFormWrapper
          form={form}
          billingEntityKey={billingEntityKey}
          comboboxData={comboboxData}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onRefresh={refresh}
        />
      )}
    />
  )
}
