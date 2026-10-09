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

import { AvalaraIntegrationMapItemFormWrapper } from './AvalaraIntegrationMapItemFormWrapper'
import { AvalaraIntegrationMapItemDrawerProps } from './types'
import { useAvalaraIntegrationMappingCUD } from './useAvalaraIntegrationMappingCUD'
import { useAvalaraIntegrationTitleAndDescriptionMapping } from './useAvalaraIntegrationTitleAndDescriptionMapping'
import {
  avalaraMappingDefaultValues,
  AvalaraMappingFormValues,
  avalaraMappingValidationSchema,
} from './validationSchema'

const AVALARA_INTEGRATION_MAP_ITEM_FORM_ID = 'avalara-integration-map-item-drawer-form'

type UseAvalaraIntegrationMapItemDrawerReturn = {
  openDrawer: (drawerProps: AvalaraIntegrationMapItemDrawerProps) => void
}

const getFormInitialValues = (
  drawerProps: AvalaraIntegrationMapItemDrawerProps,
): AvalaraMappingFormValues =>
  drawerProps.billingEntities.reduce<AvalaraMappingFormValues>((acc, billingEntity) => {
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

    acc[billingEntityKey] = {
      externalId: drawerProps.itemMappings[billingEntityKey].itemExternalId || '',
      externalName: drawerProps.itemMappings[billingEntityKey].itemExternalName || '',
    }

    return acc
  }, {})

export const useAvalaraIntegrationMapItemDrawer = (): UseAvalaraIntegrationMapItemDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const [localData, setLocalData] = useState<AvalaraIntegrationMapItemDrawerProps | undefined>(
    undefined,
  )

  const { getTitleAndDescription } = useAvalaraIntegrationTitleAndDescriptionMapping()
  const mappingFunctions = useAvalaraIntegrationMappingCUD(localData?.type)

  const form = useAppForm({
    defaultValues: avalaraMappingDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: avalaraMappingValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const isSuccess = await submitIntegrationMapItemMappings({
        values: value,
        drawerData: localData,
        mappingFunctions,
        provider: IntegrationTypeEnum.Avalara,
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
        AVALARA_INTEGRATION_MAP_ITEM_FORM_ID,
        formApi.state.errorMap.onDynamic || {},
      )
    },
  })

  const openDrawer = (drawerProps: AvalaraIntegrationMapItemDrawerProps): void => {
    setLocalData(drawerProps)
    form.reset(getFormInitialValues(drawerProps), { keepDefaultValues: true })

    const { title, description } = getTitleAndDescription(drawerProps, drawerProps.type)

    void drawer.open({
      title,
      form: { id: AVALARA_INTEGRATION_MAP_ITEM_FORM_ID, submit: form.handleSubmit },
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
          formId={AVALARA_INTEGRATION_MAP_ITEM_FORM_ID}
          renderForm={(billingEntityKey) => (
            <AvalaraIntegrationMapItemFormWrapper form={form} billingEntityKey={billingEntityKey} />
          )}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="avalara-integration-map-item-drawer-save">
            {translate('text_6630e51df0a194013daea624')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
