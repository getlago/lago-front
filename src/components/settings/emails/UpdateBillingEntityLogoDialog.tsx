import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { LogoPicker } from '~/components/LogoPicker'
import { useGetBillingEntityQuery, useUpdateBillingEntityLogoMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const UPDATE_BILLING_ENTITY_LOGO_FORM_ID = 'update-billing-entity-logo-form'

gql`
  mutation updateBillingEntityLogo($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      logoUrl
    }
  }
`

const validationSchema = z.object({
  // `null` means "clear the logo"; `undefined` means "unchanged"; a string is a data-uri upload.
  logo: z.union([z.string(), z.null(), z.undefined()]),
})

type UpdateBillingEntityLogoDialogData = {
  existingLogoUrl: string | null | undefined
}

export const useUpdateBillingEntityLogoDialog = () => {
  const formDialog = useFormDialog()
  const { billingEntityCode } = useParams<string>()
  const { translate } = useInternationalization()
  const dataRef = useRef<UpdateBillingEntityLogoDialogData | null>(null)
  const successRef = useRef(false)

  const [updateLogo] = useUpdateBillingEntityLogoMutation()

  const { data: billingEntityData } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode as string,
    },
    skip: !billingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  const form = useAppForm({
    defaultValues: {
      logo: undefined as string | null | undefined,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateLogo({
        variables: { input: { id: billingEntity?.id as string, logo: value.logo } },
      })

      if (result.data?.updateBillingEntity) {
        successRef.current = true
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

  const openUpdateBillingEntityLogoDialog = (data: UpdateBillingEntityLogoDialogData) => {
    dataRef.current = data
    form.reset()

    formDialog
      .open({
        title: translate('text_6411e69b9bda18008db7ad51'),
        description: translate('text_6411e6a2de0b3f00b25ae488'),
        closeOnError: false,
        children: (
          <div className="p-8">
            <form.AppField name="logo">
              {(field) => (
                <LogoPicker
                  logoValue={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  logoUrl={dataRef.current?.existingLogoUrl}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_6411e6ac9a8c9700a7570a4e')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: UPDATE_BILLING_ENTITY_LOGO_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openUpdateBillingEntityLogoDialog }
}
