import { FetchResult } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import NetsuiteAdditionalMappingForm from './NetsuiteAdditionalMappingForm'
import { NetsuiteAdditionalMappingDrawerProps } from './types'
import { useNetsuiteAdditionalMappingsCUD } from './useNetsuiteAdditionalMappingsCUD'
import {
  buildCurrenciesMappingInput,
  netsuiteAdditionalMappingDefaultValues,
  netsuiteAdditionalMappingValidationSchema,
} from './validationSchema'

const NETSUITE_ADDITIONAL_MAPPING_FORM_ID = 'netsuite-additional-mapping-drawer-form'

export type UseNetsuiteAdditionalMappingDrawerReturn = {
  openDrawer: (drawerProps: NetsuiteAdditionalMappingDrawerProps) => void
}

export const useNetsuiteAdditionalMappingDrawer = (): UseNetsuiteAdditionalMappingDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const drawerPropsRef = useRef<NetsuiteAdditionalMappingDrawerProps | undefined>(undefined)

  const { createCollectionMapping, updateCollectionMapping, deleteCollectionMapping } =
    useNetsuiteAdditionalMappingsCUD()

  const form = useAppForm({
    defaultValues: netsuiteAdditionalMappingDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: netsuiteAdditionalMappingValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const openedWith = drawerPropsRef.current

      if (openedWith?.type !== MappingTypeEnum.Currencies) {
        return
      }

      const { integrationId, itemId, type } = openedWith
      const currencies = buildCurrenciesMappingInput(value)

      // An empty list only means "delete" on an existing mapping; with nothing
      // mapped yet there is nothing to create.
      if (!itemId && !currencies.length) {
        drawer.close()
        return
      }

      const runMutation = (): Promise<FetchResult<unknown>> => {
        if (!itemId) {
          return createCollectionMapping({
            variables: { input: { integrationId, mappingType: type, currencies } },
          })
        }

        // Emptying every row is how the drawer deletes the whole mapping
        if (!currencies.length) {
          return deleteCollectionMapping({ variables: { input: { id: itemId } } })
        }

        return updateCollectionMapping({
          variables: { input: { id: itemId, integrationId, mappingType: type, currencies } },
        })
      }

      const { errors } = await runMutation()

      if (!errors?.length) {
        drawer.close()
      }
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(
        NETSUITE_ADDITIONAL_MAPPING_FORM_ID,
        formApi.state.errorMap.onDynamic || {},
      )
    },
  })

  const openDrawer = (drawerProps: NetsuiteAdditionalMappingDrawerProps): void => {
    drawerPropsRef.current = drawerProps

    form.reset(
      {
        default: (drawerProps.mappings ?? []).map(({ currencyCode, currencyExternalCode }) => ({
          currencyCode,
          currencyExternalCode,
        })),
      },
      { keepDefaultValues: true },
    )

    const title = translate('text_1762447116967mm930ergbsm')

    drawer.open({
      title,
      form: { id: NETSUITE_ADDITIONAL_MAPPING_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      cancelOrCloseText: 'cancel',
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      children: (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-1">
            <Typography variant="headline">{title}</Typography>
            <Typography>{translate('text_1762447116967j8jesn54y68')}</Typography>
          </div>
          <div className="mb-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Typography variant="subhead1">
                {translate('text_1762447672902pzry6bl0qnj')}
              </Typography>
              <Typography variant="caption">
                {translate('text_1762447672902fngpnyhdc9x')}
              </Typography>
            </div>
            <NetsuiteAdditionalMappingForm form={form} />
          </div>
        </div>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="netsuite-additional-mapping-drawer-save">
            {translate('text_6630e51df0a194013daea624')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
