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

export const XeroIntegrationMapItemDrawerContent = ({
  formType,
  integrationId,
  form,
  ...contentProps
}: XeroIntegrationMapItemDrawerContentProps): JSX.Element => {
  const { items, isLoading, refresh } = useXeroIntegrationItems(formType, integrationId)

  return (
    <IntegrationMapItemDrawerContent
      {...contentProps}
      form={form}
      renderForm={(billingEntityKey) => (
        <XeroIntegrationMapItemFormWrapper
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
