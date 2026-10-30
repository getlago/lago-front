import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { GetCreditNoteForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { MetadataEditDrawerContent } from './MetadataEditDrawerContent'
import { useEditCreditNote } from './useEditCreditNote'
import { METADATA_EDIT_DEFAULT_VALUES, metadataEditValidationSchema } from './validationSchema'

export const METADATA_EDIT_DRAWER_SAVE_TEST_ID = 'metadata-edit-drawer-save'

const METADATA_EDIT_FORM_ID = 'credit-note-metadata-edit-form'

type UseMetadataEditDrawerProps = {
  creditNote: GetCreditNoteForDetailsQuery['creditNote']
}

type UseMetadataEditDrawerReturn = {
  openDrawer: () => void
}

export const useMetadataEditDrawer = ({
  creditNote,
}: UseMetadataEditDrawerProps): UseMetadataEditDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { updateCreditNote } = useEditCreditNote()

  const form = useAppForm({
    defaultValues: METADATA_EDIT_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: metadataEditValidationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(METADATA_EDIT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      if (!creditNote) return

      const { errors } = await updateCreditNote({
        variables: {
          input: {
            id: creditNote.id,
            metadata: value.metadata.map(({ key, value: metadataValue }) => ({
              key,
              value: metadataValue,
            })),
          },
        },
      })

      if (errors?.length) return

      addToast({
        message: translate('text_17647718978181hu15vk5h86'),
        severity: 'success',
      })

      drawer.close()
    },
  })

  const openDrawer = (): void => {
    form.reset(
      {
        metadata: (creditNote?.metadata || []).map((metadata) => ({
          key: metadata.key,
          value: metadata.value || '',
        })),
      },
      { keepDefaultValues: true },
    )

    void drawer.open({
      title: translate('text_176466851340792f3wzvqvb8'),
      form: { id: METADATA_EDIT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      children: <MetadataEditDrawerContent form={form} />,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={METADATA_EDIT_DRAWER_SAVE_TEST_ID}>
            {translate('text_1764684767320qeu0x6az165')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
