import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { METADATA_KEY_MAX_LENGTH, zodMetadataSchema } from '~/formValidation/metadataSchema'
import {
  InvoiceMetadatasForMetadataDrawerFragment,
  LagoApiError,
  useGetInvoiceMetadataForEditionQuery,
  useUpdateInvoiceMetadataMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { AddMetadataDrawerContent } from './AddMetadataDrawerContent'
import { ADD_METADATA_DRAWER_FORM_ID, DEFAULT_VALUES, METADATA_VALUE_MAX_LENGTH } from './constants'

gql`
  fragment InvoiceMetadatasForMetadataDrawer on Invoice {
    id
    metadata {
      id
      key
      value
    }
  }

  mutation updateInvoiceMetadata($input: UpdateInvoiceInput!) {
    updateInvoice(input: $input) {
      id
      ...InvoiceMetadatasForMetadataDrawer
    }
  }

  query getInvoiceMetadataForEdition($id: ID!) {
    invoice(id: $id) {
      id
      ...InvoiceMetadatasForMetadataDrawer
    }
  }
`

const addMetadataValidationSchema = z.object({
  metadata: zodMetadataSchema(METADATA_VALUE_MAX_LENGTH, METADATA_KEY_MAX_LENGTH),
})

type UseAddMetadataDrawerProps = {
  invoiceId: string | undefined
}

type UseAddMetadataDrawerReturn = {
  openDrawer: () => void
}

export const useAddMetadataDrawer = ({
  invoiceId,
}: UseAddMetadataDrawerProps): UseAddMetadataDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  // Captured when the drawer opens so the copy and the success toast keep
  // describing the state the user started from, even after the cache updates.
  const isEditionRef = useRef(false)

  const { data, refetch } = useGetInvoiceMetadataForEditionQuery({
    variables: {
      id: invoiceId || '',
    },
    skip: !invoiceId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const [updateInvoiceMetadata] = useUpdateInvoiceMetadataMutation()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: addMetadataValidationSchema,
    },
    onSubmit: async ({ value }) => {
      // Never null in practice: `openDrawer` refuses to open without an invoice.
      if (!invoiceId) {
        return
      }

      const { errors } = await updateInvoiceMetadata({
        variables: {
          input: {
            id: invoiceId,
            metadata: value.metadata.map((metadata) => ({
              id: metadata.id,
              key: metadata.key,
              value: metadata.value,
            })),
          },
        },
      })

      if (errors?.length) {
        return
      }

      addToast({
        message: translate(
          isEditionRef.current ? 'text_6405cac5c833dcf18cad01fb' : 'text_6405cac5c833dcf18cad0204',
        ),
        severity: 'success',
      })

      drawer.close()
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(ADD_METADATA_DRAWER_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const openWithMetadata = (
    metadata: NonNullable<InvoiceMetadatasForMetadataDrawerFragment['metadata']>,
  ): void => {
    const existingMetadata = metadata.map(({ id, key, value }) => ({
      id,
      key,
      value,
    }))

    isEditionRef.current = existingMetadata.length > 0

    form.reset(
      { metadata: isEditionRef.current ? existingMetadata : [{ key: '', value: '' }] },
      { keepDefaultValues: true },
    )

    drawer.open({
      title: translate(
        isEditionRef.current ? 'text_6405cac5c833dcf18cacff2a' : 'text_6405cac5c833dcf18cacff2c',
      ),
      form: { id: ADD_METADATA_DRAWER_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      cancelOrCloseText: 'cancel',
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      children: <AddMetadataDrawerContent form={form} isEdition={isEditionRef.current} />,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="submit">
            {translate(
              isEditionRef.current
                ? 'text_6405cac5c833dcf18cacffec'
                : 'text_6405cac5c833dcf18cacff4a',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  // The invoice details page does not prime this fragment, so the drawer can be
  // opened before the query lands. Seeding it empty would drop the pairs the
  // invoice already has on the next save, so fetch them first in that case.
  const openDrawer = (): void => {
    if (!invoiceId) {
      return
    }

    if (data?.invoice) {
      openWithMetadata(data.invoice.metadata || [])
      return
    }

    refetch()
      .then((result) => openWithMetadata(result.data?.invoice?.metadata || []))
      .catch(() => openWithMetadata([]))
  }

  return { openDrawer }
}
