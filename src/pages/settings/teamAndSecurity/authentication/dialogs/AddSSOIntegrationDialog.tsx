import { MutationHookOptions, MutationTuple, OperationVariables } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { ZodTypeAny } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { AuthenticationMethodsEnum, useDestroyIntegrationMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

/** Shared label used by both providers for the edit submit button. */
const EDIT_SUBMIT_TRANSLATION_KEY = 'text_664c732c264d7eed1c74fdaa'

type IntegrationMutationHook<TData, TVariables extends OperationVariables> = (
  baseOptions?: MutationHookOptions<TData, TVariables>,
) => MutationTuple<TData, TVariables>

export type SSOIntegrationField<TFormValues> = {
  name: keyof TFormValues & string
  labelKey: string
  placeholderKey: string
  helperKey?: string
  autoFocus?: boolean
  endAdornmentKey?: string
}

export type AddSSOIntegrationDialogData<TIntegration> = {
  integration?: TIntegration
  callback?: (id: string) => void
  deleteCallback?: () => void
}

export type UseAddSSOIntegrationDialogConfig<
  TFormValues extends Record<string, unknown>,
  TIntegration extends { id: string },
  TCreateData,
  TCreateVars extends OperationVariables,
  TUpdateData,
  TUpdateVars extends OperationVariables,
> = {
  formId: string
  submitBtnTestId: string
  authenticationMethod: AuthenticationMethodsEnum
  /** GraphQL __typename used to evict the deleted integration from the cache. */
  integrationTypename: 'OktaIntegration' | 'EntraIdIntegration'
  defaultFormValues: TFormValues
  validationSchema: ZodTypeAny
  fields: SSOIntegrationField<TFormValues>[]
  useCreateIntegrationMutation: IntegrationMutationHook<TCreateData, TCreateVars>
  useUpdateIntegrationMutation: IntegrationMutationHook<TUpdateData, TUpdateVars>
  getCreatedIntegrationId: (data: TCreateData) => string | undefined
  getUpdatedIntegrationId: (data: TUpdateData) => string | undefined
  setFormValuesFromIntegration: (
    integration: TIntegration,
    setFieldValue: (name: keyof TFormValues & string, value: string) => void,
  ) => void
  translations: {
    createTitle: string
    editTitle: string
    createDescription: string
    editDescription: string
    createSubmit: string
    createSuccess: string
    updateSuccess: string
    integrationName: string
    deleteDialogTitle: string
    deleteDialogDescription: string
    deleteSuccess: string
  }
}

export const useAddSSOIntegrationDialog = <
  TFormValues extends Record<string, unknown>,
  TIntegration extends { id: string },
  TCreateData,
  TCreateVars extends OperationVariables,
  TUpdateData,
  TUpdateVars extends OperationVariables,
>(
  config: UseAddSSOIntegrationDialogConfig<
    TFormValues,
    TIntegration,
    TCreateData,
    TCreateVars,
    TUpdateData,
    TUpdateVars
  >,
) => {
  const {
    formId,
    submitBtnTestId,
    authenticationMethod,
    integrationTypename,
    defaultFormValues,
    validationSchema,
    fields,
    useCreateIntegrationMutation,
    useUpdateIntegrationMutation,
    getCreatedIntegrationId,
    getUpdatedIntegrationId,
    setFormValuesFromIntegration,
    translations,
  } = config

  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const dataRef = useRef<AddSSOIntegrationDialogData<TIntegration> | null>(null)
  const successRef = useRef(false)

  const [createIntegration] = useCreateIntegrationMutation({
    onCompleted: (res) => {
      const id = getCreatedIntegrationId(res)

      if (!id) return

      successRef.current = true
      dataRef.current?.callback?.(id)
      addToast({
        severity: 'success',
        message: translate(translations.createSuccess, {
          integration: translate(translations.integrationName),
        }),
      })
    },
  })

  const [updateIntegration] = useUpdateIntegrationMutation({
    onCompleted: (res) => {
      const id = getUpdatedIntegrationId(res)

      if (!id) return

      successRef.current = true
      dataRef.current?.callback?.(id)
      addToast({
        severity: 'success',
        message: translate(translations.updateSuccess, {
          integration: translate(translations.integrationName),
        }),
      })
    },
  })

  const [deleteIntegration] = useDestroyIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      // TanStack detects standard schemas at runtime; the generic form value
      // type prevents statically relating the provider schema, so it is cast.
      onDynamic: validationSchema as unknown as never,
    },
    onSubmit: async ({ value }) => {
      const integration = dataRef.current?.integration

      if (integration) {
        await updateIntegration({
          variables: {
            input: {
              ...value,
              id: integration.id,
            },
          } as unknown as TUpdateVars,
        })
      } else {
        await createIntegration({ variables: { input: value } as unknown as TCreateVars })
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openDialog = (data?: AddSSOIntegrationDialogData<TIntegration>) => {
    dataRef.current = data ?? null
    const integration = data?.integration
    const isEdition = !!integration

    const hasOtherAuthenticationMethods = organization?.authenticationMethods.some(
      (method) => method !== authenticationMethod,
    )

    form.reset()
    if (integration) {
      setFormValuesFromIntegration(integration, (name, fieldValue) =>
        form.setFieldValue(name, fieldValue as never),
      )
    }

    formDialogOpeningDialog
      .open({
        title: translate(isEdition ? translations.editTitle : translations.createTitle),
        description: translate(
          isEdition ? translations.editDescription : translations.createDescription,
        ),
        children: (
          <div className="flex flex-col gap-6 p-8">
            {fields.map((fieldConfig) => (
              <form.AppField key={fieldConfig.name} name={fieldConfig.name}>
                {(field) => (
                  <field.TextInputField
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={fieldConfig.autoFocus}
                    label={translate(fieldConfig.labelKey)}
                    placeholder={translate(fieldConfig.placeholderKey)}
                    helperText={
                      fieldConfig.helperKey ? translate(fieldConfig.helperKey) : undefined
                    }
                    InputProps={
                      fieldConfig.endAdornmentKey
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                {translate(fieldConfig.endAdornmentKey)}
                              </InputAdornment>
                            ),
                          }
                        : undefined
                    }
                  />
                )}
              </form.AppField>
            ))}
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={submitBtnTestId}>
              {translate(isEdition ? EDIT_SUBMIT_TRANSLATION_KEY : translations.createSubmit)}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: formId,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition && !!data?.deleteCallback && !!hasOtherAuthenticationMethods,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate(translations.deleteDialogTitle),
          description: translate(translations.deleteDialogDescription),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const result = await deleteIntegration({
              variables: {
                input: {
                  id: integration?.id ?? '',
                },
              },
              update(cache) {
                cache.evict({ id: `${integrationTypename}:${integration?.id}` })
              },
            })

            if (result.data?.destroyIntegration) {
              data?.deleteCallback?.()
              addToast({
                message: translate(translations.deleteSuccess, {
                  integration: translate(translations.integrationName),
                }),
                severity: 'success',
              })
            }
          },
        },
      })
      .then((response) => {
        if (response.reason === 'close' || response.reason === 'open-other-dialog') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openDialog }
}
