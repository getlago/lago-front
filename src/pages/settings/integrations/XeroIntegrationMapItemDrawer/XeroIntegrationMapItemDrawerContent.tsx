import { ComponentProps, useState } from 'react'

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
// query owned by the form wrapper re-runs on every tab switch.
export const XeroIntegrationMapItemDrawerContent = ({
  formType,
  integrationId,
  form,
  ...contentProps
}: XeroIntegrationMapItemDrawerContentProps): JSX.Element => {
  const { items, searchResults, isLoading, search, refresh } = useXeroIntegrationItems(
    formType,
    integrationId,
  )
  const [searchingKey, setSearchingKey] = useState<string | undefined>(undefined)

  // A field that keeps its value on blur never clears its own search term, so the last field to
  // search owns the shared results and the others fall back to the unfiltered list.
  const handleSearch = (billingEntityKey: string, searchTerm: string | undefined): void => {
    setSearchingKey(searchTerm ? billingEntityKey : undefined)
  }

  return (
    <IntegrationMapItemDrawerContent
      {...contentProps}
      form={form}
      renderForm={(billingEntityKey) => (
        <XeroIntegrationMapItemFormWrapper
          form={form}
          billingEntityKey={billingEntityKey}
          items={items}
          searchResults={searchResults}
          isSearching={searchingKey === billingEntityKey}
          isLoading={isLoading}
          search={search}
          onSearch={handleSearch}
          onRefresh={refresh}
        />
      )}
    />
  )
}
