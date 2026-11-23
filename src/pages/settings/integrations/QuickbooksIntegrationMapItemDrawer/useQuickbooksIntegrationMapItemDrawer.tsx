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
import { submitIntegrationMapItemMappings } from '~/pages/settings/integrations/IntegrationMapItemDrawer'
import { stringifyOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/stringifyOptionValue'

import { QuickbooksIntegrationMapItemDrawerContent } from './QuickbooksIntegrationMapItemDrawerContent'
import { QuickbooksIntegrationMapItemDrawerProps } from './types'
import { useQuickbooksIntegrationMappingCRUD } from './useQuickbooksIntegrationMappingCRUD'
import { useQuickbooksIntegrationTitleAndDescriptionMapping } from './useQuickbooksIntegrationTitleAndDescriptionMapping'
import {
  quickbooksMappingDefaultValues,
  QuickbooksMappingFormValues,
  quickbooksMappingValidationSchema,
} from './validationSchema'

const QUICKBOOKS_INTEGRATION_MAP_ITEM_FORM_ID = 'quickbooks-integration-map-item-drawer-form'

type UseQuickbooksIntegrationMapItemDrawerReturn = {
  openDrawer: (drawerProps: QuickbooksIntegrationMapItemDrawerProps) => void
}

const getFormInitialValues = (
  drawerProps: QuickbooksIntegrationMapItemDrawerProps,
): QuickbooksMappingFormValues =>
  drawerProps.billingEntities.reduce<QuickbooksMappingFormValues>((acc, billingEntity) => {
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

    const { itemExternalId, itemExternalName } = drawerProps.itemMappings[billingEntityKey]

    acc[billingEntityKey] = {
      selectedElementValue:
        itemExternalId && itemExternalName
          ? stringifyOptionValue({
              externalId: itemExternalId,
              externalName: itemExternalName,
              externalAccountCode: '',
            })
          : '',
    }

    return acc
  }, {})

export const useQuickbooksIntegrationMapItemDrawer =
  (): UseQuickbooksIntegrationMapItemDrawerReturn => {
    const { translate } = useInternationalization()
    const drawer = useFormDrawer()
    const [localData, setLocalData] = useState<QuickbooksIntegrationMapItemDrawerProps | undefined>(
      undefined,
    )

    const { getTitleAndDescription } = useQuickbooksIntegrationTitleAndDescriptionMapping()
    const mappingFunctions = useQuickbooksIntegrationMappingCRUD(localData?.type)

    const form = useAppForm({
      defaultValues: quickbooksMappingDefaultValues,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: quickbooksMappingValidationSchema,
      },
      onSubmit: async ({ value }) => {
        const { success, itemMappings } = await submitIntegrationMapItemMappings({
          values: Object.fromEntries(
            Object.entries(value).map(([billingEntityKey, { selectedElementValue }]) => [
              billingEntityKey,
              { selectedElementValue: selectedElementValue ?? '' },
            ]),
          ),
          drawerData: localData,
          mappingFunctions,
          provider: IntegrationTypeEnum.Quickbooks,
        })

        if (!success) {
          setLocalData((previous) =>
            previous && previous === localData ? { ...previous, itemMappings } : previous,
          )

          return
        }

        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
        setLocalData(undefined)
        drawer.close()
      },
      onSubmitInvalid({ formApi }) {
        scrollToFirstInputError(
          QUICKBOOKS_INTEGRATION_MAP_ITEM_FORM_ID,
          formApi.state.errorMap.onDynamic || {},
        )
      },
    })

    const openDrawer = (drawerProps: QuickbooksIntegrationMapItemDrawerProps): void => {
      setLocalData(drawerProps)
      form.reset(getFormInitialValues(drawerProps), { keepDefaultValues: true })

      const { title, description } = getTitleAndDescription(drawerProps, drawerProps.type)

      void drawer.open({
        title,
        form: { id: QUICKBOOKS_INTEGRATION_MAP_ITEM_FORM_ID, submit: form.handleSubmit },
        closeOnSubmitSuccess: false,
        cancelOrCloseText: 'cancel',
        shouldPromptOnClose: () => form.state.isDirty,
        onClose: () => form.reset(),
        onEntered: focusFirstInput,
        children: (
          <QuickbooksIntegrationMapItemDrawerContent
            title={title}
            description={description}
            billingEntities={drawerProps.billingEntities}
            form={form}
            formId={QUICKBOOKS_INTEGRATION_MAP_ITEM_FORM_ID}
            formType={drawerProps.type}
            integrationId={drawerProps.integrationId}
          />
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="quickbooks-integration-map-item-drawer-save">
              {translate('text_6630e51df0a194013daea624')}
            </form.SubmitButton>
          </form.AppForm>
        ),
      })
    }

    return { openDrawer }
  }
