import { revalidateLogic } from '@tanstack/react-form'
import { useState } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { IntegrationTypeEnum } from '~/generated/graphql'
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

import { stringifyOptionValue } from './stringifyOptionValue'
import { XeroIntegrationMapItemDrawerProps } from './types'
import { useXeroIntegrationMappingCRUD } from './useXeroIntegrationMappingCRUD'
import { useXeroIntegrationTitleAndDescriptionMapping } from './useXeroIntegrationTitleAndDescriptionMapping'
import {
  xeroMappingDefaultValues,
  XeroMappingFormValues,
  xeroMappingValidationSchema,
} from './validationSchema'
import { XeroIntegrationMapItemFormWrapper } from './XeroIntegrationMapItemFormWrapper'

const XERO_INTEGRATION_MAP_ITEM_FORM_ID = 'xero-integration-map-item-drawer-form'

type UseXeroIntegrationMapItemDrawerReturn = {
  openDrawer: (drawerProps: XeroIntegrationMapItemDrawerProps) => void
}

const getFormInitialValues = (
  drawerProps: XeroIntegrationMapItemDrawerProps,
): XeroMappingFormValues =>
  drawerProps.billingEntities.reduce<XeroMappingFormValues>((acc, billingEntity) => {
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

    const { itemExternalId, itemExternalName, itemExternalCode } =
      drawerProps.itemMappings[billingEntityKey]

    acc[billingEntityKey] = {
      selectedElementValue:
        itemExternalId && itemExternalName && itemExternalCode
          ? stringifyOptionValue({
              externalId: itemExternalId,
              externalName: itemExternalName,
              externalAccountCode: itemExternalCode,
            })
          : '',
    }

    return acc
  }, {})

export const useXeroIntegrationMapItemDrawer = (): UseXeroIntegrationMapItemDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const [localData, setLocalData] = useState<XeroIntegrationMapItemDrawerProps | undefined>(
    undefined,
  )

  const { getTitleAndDescription } = useXeroIntegrationTitleAndDescriptionMapping()
  const mappingFunctions = useXeroIntegrationMappingCRUD(localData?.type, localData?.integrationId)

  const form = useAppForm({
    defaultValues: xeroMappingDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: xeroMappingValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const isSuccess = await submitIntegrationMapItemMappings({
        values: Object.fromEntries(
          Object.entries(value).map(([billingEntityKey, { selectedElementValue }]) => [
            billingEntityKey,
            { selectedElementValue: selectedElementValue ?? '' },
          ]),
        ),
        drawerData: localData,
        mappingFunctions,
        provider: IntegrationTypeEnum.Xero,
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
        XERO_INTEGRATION_MAP_ITEM_FORM_ID,
        formApi.state.errorMap.onDynamic || {},
      )
    },
  })

  const openDrawer = (drawerProps: XeroIntegrationMapItemDrawerProps): void => {
    setLocalData(drawerProps)
    form.reset(getFormInitialValues(drawerProps), { keepDefaultValues: true })

    const { title, description } = getTitleAndDescription(drawerProps, drawerProps.type)

    drawer.open({
      title,
      form: { id: XERO_INTEGRATION_MAP_ITEM_FORM_ID, submit: form.handleSubmit },
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
          renderForm={(billingEntityKey) => (
            <XeroIntegrationMapItemFormWrapper
              form={form}
              billingEntityKey={billingEntityKey}
              formType={drawerProps.type}
              integrationId={drawerProps.integrationId}
            />
          )}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="xero-integration-map-item-drawer-save">
            {translate('text_6630e51df0a194013daea624')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
