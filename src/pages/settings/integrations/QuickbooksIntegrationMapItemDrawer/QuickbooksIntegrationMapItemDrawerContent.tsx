import { ComponentProps, useEffect } from 'react'

import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  IntegrationMapItemDrawerContent,
  IntegrationMapItemDrawerContentProps,
} from '~/pages/settings/integrations/IntegrationMapItemDrawer'

import { QuickbooksIntegrationMapItemFormWrapper } from './QuickbooksIntegrationMapItemFormWrapper'
import { useQuickbooksIntegrationItems } from './useQuickbooksIntegrationItems'

type QuickbooksIntegrationMapItemDrawerContentProps = Omit<
  IntegrationMapItemDrawerContentProps,
  'renderForm' | 'form'
> & {
  form: ComponentProps<typeof QuickbooksIntegrationMapItemFormWrapper>['form']
  formType: MappingTypeEnum | MappableTypeEnum | undefined
  integrationId: string | undefined
}

export const QuickbooksIntegrationMapItemDrawerContent = ({
  formType,
  integrationId,
  form,
  ...contentProps
}: QuickbooksIntegrationMapItemDrawerContentProps): JSX.Element => {
  const { items, isLoading, refresh } = useQuickbooksIntegrationItems(formType, integrationId)

  // Opening the drawer syncs the QuickBooks catalog first, so a new item or account is listed.
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <IntegrationMapItemDrawerContent
      {...contentProps}
      form={form}
      renderForm={(billingEntityKey) => (
        <QuickbooksIntegrationMapItemFormWrapper
          form={form}
          billingEntityKey={billingEntityKey}
          items={items}
          isLoading={isLoading}
          formType={formType}
          integrationId={integrationId}
          onRefresh={refresh}
        />
      )}
    />
  )
}
