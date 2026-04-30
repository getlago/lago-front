import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { LagoApiError, useUpdateOrganizationSlugMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  editOrganizationSlugDefaultValues,
  editOrganizationSlugValidationSchema,
} from './validationSchema'

gql`
  mutation updateOrganizationSlug($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      slug
    }
  }
`

const EDIT_ORGANIZATION_SLUG_FORM_ID = 'form-edit-organization-slug'

type EditOrganizationSlugDialogData = {
  currentSlug: string
}

export const useEditOrganizationSlugDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()

  const dataRef = useRef<EditOrganizationSlugDialogData | null>(null)
  const successRef = useRef<{ orgId: string; savedSlug: string } | null>(null)

  // NOTE: in this branch URLs do not yet include the org slug (LAGO-1346
  // ships that). When LAGO-1344/1345 land, an `update(cache, ...)` patch on
  // `Organization:${id}` will be needed here to keep `OrganizationLayout` in
  // sync with the new URL slug — see the original commit on
  // `LAGO-1342-organization-slug` for the full implementation.
  const [updateOrganizationSlug] = useUpdateOrganizationSlugMutation()

  const form = useAppForm({
    defaultValues: editOrganizationSlugDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editOrganizationSlugValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await updateOrganizationSlug({
        variables: { input: { slug: value.slug } },
        context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      })

      const { errors, data } = result

      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'slug')) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              slug: {
                message: 'text_1776867582730tgxmf57unmt',
                path: ['slug'],
              },
            },
          },
        })

        return
      }

      if (errors?.length) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              slug: {
                message: 'text_1776867582730967zpytg618',
                path: ['slug'],
              },
            },
          },
        })

        return
      }

      const savedSlug = data?.updateOrganization?.slug
      const orgId = data?.updateOrganization?.id

      if (savedSlug && orgId) {
        successRef.current = { orgId, savedSlug }
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = null
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openEditOrganizationSlugDialog = (data: EditOrganizationSlugDialogData) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue('slug', data.currentSlug)

    formDialog
      .open({
        title: translate('text_1776867582729jiym04jk1ax'),
        description: translate('text_1776867582730aqe2kknmohd'),
        children: (
          <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-grey-300 px-3 py-2">
              <span className="shrink-0 rounded-md border border-grey-300 bg-grey-100 px-2 py-1 text-sm text-grey-700">
                {translate('text_1776867582730qd932fynpjo')}
              </span>
              <form.Subscribe selector={(state) => state.values.slug}>
                {(slugValue) => (
                  <span className="truncate font-code text-sm text-grey-700">
                    {window.location.origin}
                    {'/'}
                    {slugValue}
                  </span>
                )}
              </form.Subscribe>
            </div>

            <form.AppField name="slug">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1776867582729ra096lnt5hc')}
                  placeholder={translate('text_1776867582730tl36ydvczz2')}
                  beforeChangeFormatter={['lowercase', 'dashSeparator']}
                  helperText={translate('text_1776867582730967zpytg618')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_1776867582730tnsmp9njbz7')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_ORGANIZATION_SLUG_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'success' && successRef.current && dataRef.current) {
          // NOTE: in this branch URLs do not yet include the org slug, so we
          // skip the post-rename navigation and the `locationHistoryVar`
          // rewrite that the original LAGO-1342 implementation performs. They
          // become relevant once LAGO-1344/1345/1346 ship the slug-aware
          // router. See the original commit on `LAGO-1342-organization-slug`
          // for the full migration.
          addToast({
            severity: 'success',
            translateKey: 'text_17768675827302s9i3t87uhn',
          })
        }

        form.reset()
        dataRef.current = null
        successRef.current = null
      })
  }

  return { openEditOrganizationSlugDialog }
}
