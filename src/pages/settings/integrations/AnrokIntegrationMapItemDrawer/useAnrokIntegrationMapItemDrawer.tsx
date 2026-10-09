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

import { AnrokIntegrationMapItemFormWrapper } from './AnrokIntegrationMapItemFormWrapper'
import { AnrokIntegrationMapItemDrawerProps } from './types'
import { useAnrokIntegrationMappingCUD } from './useAnrokIntegrationMappingCUD'
import { useAnrokIntegrationTitleAndDescriptionMapping } from './useAnrokIntegrationTitleAndDescriptionMapping'
import {
  anrokMappingDefaultValues,
  AnrokMappingFormValues,
  anrokMappingValidationSchema,
} from './validationSchema'

const ANROK_INTEGRATION_MAP_ITEM_FORM_ID = 'anrok-integration-map-item-drawer-form'

type UseAnrokIntegrationMapItemDrawerReturn = {
  openDrawer: (drawerProps: AnrokIntegrationMapItemDrawerProps) => void
}

const getFormInitialValues = (
  drawerProps: AnrokIntegrationMapItemDrawerProps,
): AnrokMappingFormValues =>
  drawerProps.billingEntities.reduce<AnrokMappingFormValues>((acc, billingEntity) => {
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

export const useAnrokIntegrationMapItemDrawer = (): UseAnrokIntegrationMapItemDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const [localData, setLocalData] = useState<AnrokIntegrationMapItemDrawerProps | undefined>(
    undefined,
  )

  const { getTitleAndDescription } = useAnrokIntegrationTitleAndDescriptionMapping()
  const mappingFunctions = useAnrokIntegrationMappingCUD(localData?.type)

  const form = useAppForm({
    defaultValues: anrokMappingDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: anrokMappingValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const isSuccess = await submitIntegrationMapItemMappings({
        values: value,
        drawerData: localData,
        mappingFunctions,
        provider: IntegrationTypeEnum.Anrok,
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
        ANROK_INTEGRATION_MAP_ITEM_FORM_ID,
        formApi.state.errorMap.onDynamic || {},
      )
    },
  })

  const openDrawer = (drawerProps: AnrokIntegrationMapItemDrawerProps): void => {
    setLocalData(drawerProps)
    form.reset(getFormInitialValues(drawerProps), { keepDefaultValues: true })

    const { title, description } = getTitleAndDescription(drawerProps, drawerProps.type)

    void drawer.open({
      title,
      form: { id: ANROK_INTEGRATION_MAP_ITEM_FORM_ID, submit: form.handleSubmit },
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
          formId={ANROK_INTEGRATION_MAP_ITEM_FORM_ID}
          renderForm={(billingEntityKey) => (
            <AnrokIntegrationMapItemFormWrapper form={form} billingEntityKey={billingEntityKey} />
          )}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="anrok-integration-map-item-drawer-save">
            {translate('text_6630e51df0a194013daea624')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
