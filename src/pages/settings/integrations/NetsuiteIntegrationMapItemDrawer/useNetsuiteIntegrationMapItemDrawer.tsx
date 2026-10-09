import { revalidateLogic } from '@tanstack/react-form'
import { useState } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { IntegrationTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  DEFAULT_MAPPING_KEY,
  isItemMappingForKeyNotForCurrenciesMapping,
} from '~/pages/settings/integrations/common'
import {
  IntegrationMapItemDrawerContent,
  submitIntegrationMapItemMappings,
} from '~/pages/settings/integrations/IntegrationMapItemDrawer'

import { isMappingInTaxContext } from './isMappingInTaxContext'
import { NetsuiteIntegrationMapItemFormWrapper } from './NetsuiteIntegrationMapItemFormWrapper'
import { NetsuiteIntegrationMapItemDrawerProps } from './types'
import { useNetsuiteIntegrationMappingCUD } from './useNetsuiteIntegrationMappingCUD'
import { useNetsuiteIntegrationTitleAndDescriptionMapping } from './useNetsuiteIntegrationTitleAndDescriptionMapping'
import {
  netsuiteMappingDefaultValues,
  NetsuiteMappingFormValues,
  netsuiteNonTaxMappingValidationSchema,
  netsuiteTaxMappingValidationSchema,
} from './validationSchema'

const NETSUITE_INTEGRATION_MAP_ITEM_FORM_ID = 'netsuite-integration-map-item-drawer-form'

type UseNetsuiteIntegrationMapItemDrawerReturn = {
  openDrawer: (drawerProps: NetsuiteIntegrationMapItemDrawerProps) => void
}

const getFormInitialValues = (
  drawerProps: NetsuiteIntegrationMapItemDrawerProps,
): NetsuiteMappingFormValues =>
  drawerProps.billingEntities.reduce<NetsuiteMappingFormValues>((acc, billingEntity) => {
    const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY

    if (
      !isItemMappingForKeyNotForCurrenciesMapping(
        drawerProps,
        drawerProps.itemMappings,
        billingEntityKey,
      )
    ) {
      return acc
    }

    const isTaxMapping = isMappingInTaxContext(drawerProps, billingEntityKey)

    acc[billingEntityKey] = {
      taxCode: isTaxMapping ? drawerProps.itemMappings[billingEntityKey].taxCode || '' : '',
      taxNexus: isTaxMapping ? drawerProps.itemMappings[billingEntityKey].taxNexus || '' : '',
      taxType: isTaxMapping ? drawerProps.itemMappings[billingEntityKey].taxType || '' : '',
      externalId: drawerProps.itemMappings[billingEntityKey].itemExternalId || '',
      externalName: drawerProps.itemMappings[billingEntityKey].itemExternalName || '',
      externalAccountCode: drawerProps.itemMappings[billingEntityKey].itemExternalCode || '',
    }

    return acc
  }, {})

export const useNetsuiteIntegrationMapItemDrawer =
  (): UseNetsuiteIntegrationMapItemDrawerReturn => {
    const { translate } = useInternationalization()
    const drawer = useFormDrawer()
    const [localData, setLocalData] = useState<NetsuiteIntegrationMapItemDrawerProps | undefined>(
      undefined,
    )

    const isTaxContext = localData?.type === MappingTypeEnum.Tax

    const { getTitleAndDescription } = useNetsuiteIntegrationTitleAndDescriptionMapping()
    const mappingFunctions = useNetsuiteIntegrationMappingCUD(localData?.type)

    const form = useAppForm({
      defaultValues: netsuiteMappingDefaultValues,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: isTaxContext
          ? netsuiteTaxMappingValidationSchema
          : netsuiteNonTaxMappingValidationSchema,
      },
      onSubmit: async ({ value }) => {
        const isSuccess = await submitIntegrationMapItemMappings({
          values: value,
          drawerData: localData,
          mappingFunctions,
          provider: IntegrationTypeEnum.Netsuite,
        })

        if (!isSuccess) return

        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
        setLocalData(undefined)
        drawer.close()
      },
      onSubmitInvalid({ formApi }) {
        scrollToFirstInputError(
          NETSUITE_INTEGRATION_MAP_ITEM_FORM_ID,
          formApi.state.errorMap.onDynamic || {},
        )
      },
    })

    const openDrawer = (drawerProps: NetsuiteIntegrationMapItemDrawerProps): void => {
      setLocalData(drawerProps)
      form.reset(getFormInitialValues(drawerProps), { keepDefaultValues: true })

      const { title, description } = getTitleAndDescription(drawerProps, drawerProps.type)

      void drawer.open({
        title,
        form: { id: NETSUITE_INTEGRATION_MAP_ITEM_FORM_ID, submit: form.handleSubmit },
        closeOnSubmitSuccess: false,
        cancelOrCloseText: 'cancel',
        shouldPromptOnClose: () => form.state.isDirty,
        onClose: () => form.reset(),
        onEntered: focusFirstInput,
        children: (
          <IntegrationMapItemDrawerContent
            title={title}
            description={description}
            billingEntities={drawerProps.billingEntities}
            form={form}
            renderForm={(billingEntityKey) => (
              <NetsuiteIntegrationMapItemFormWrapper
                form={form}
                billingEntityKey={billingEntityKey}
                isTaxContext={drawerProps.type === MappingTypeEnum.Tax}
              />
            )}
          />
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="netsuite-integration-map-item-drawer-save">
              {translate('text_6630e51df0a194013daea624')}
            </form.SubmitButton>
          </form.AppForm>
        ),
      })
    }

    return { openDrawer }
  }
