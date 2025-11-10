import { FormikProps } from 'formik'

import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  BillingEntityForIntegrationMapping,
  ItemMappingPerBillingEntity,
} from '~/pages/settings/integrations/common'

export type AvalaraIntegrationMapItemDrawerProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  billingEntities: Array<BillingEntityForIntegrationMapping>
  itemMappings: ItemMappingPerBillingEntity
}

export type FormValuesType = Record<
  'default' | string,
  {
    externalName: string
    externalId: string
  }
>

export type AvalaraIntegrationMapItemFormProps = {
  formikProps: FormikProps<FormValuesType>
  billingEntityKey: 'default' | string
}

export interface AvalaraIntegrationMapItemDrawerRef {
  openDrawer: (props: AvalaraIntegrationMapItemDrawerProps) => unknown
  closeDrawer: () => unknown
}
