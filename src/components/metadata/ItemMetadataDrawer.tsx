import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  DEFAULT_VALUES,
  ITEM_METADATA_KEY_MAX_LENGTH,
  ITEM_METADATA_VALUE_MAX_LENGTH,
  type ItemMetadataFormValues,
} from './constants'
import { ItemMetadataDrawerContent } from './ItemMetadataDrawerContent'

export { type ItemMetadataFormValues } from './constants'

const ITEM_METADATA_FORM_ID = 'item-metadata-drawer-form'

const itemMetadataSchema = z.object({
  metadata: zodMetadataSchema(ITEM_METADATA_VALUE_MAX_LENGTH, ITEM_METADATA_KEY_MAX_LENGTH),
})

export interface ItemMetadataDrawerRef {
  openDrawer: (values?: ItemMetadataFormValues, opts?: { appendEmptyRow?: boolean }) => void
  closeDrawer: () => void
}

interface ItemMetadataDrawerProps {
  // Owner-specific copy shown under the drawer title, e.g.
  // "Store custom key-value pairs on this plan."
  description: string
  onSave: (values: ItemMetadataFormValues) => void | boolean | Promise<void | boolean>
  onDelete?: () => void | boolean | Promise<void | boolean>
}

export const ItemMetadataDrawer = forwardRef<ItemMetadataDrawerRef, ItemMetadataDrawerProps>(
  ({ description, onSave, onDelete }, ref) => {
    const { translate } = useInternationalization()
    const metadataDrawer = useFormDrawer()
    const isAddModeRef = useRef(true)
    const focusLastKeyInputRef = useRef(false)

    const form = useAppForm({
      defaultValues: DEFAULT_VALUES,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: itemMetadataSchema,
      },
      onSubmit: async ({ value }) => {
        const result = await onSave(value)

        if (result !== false) {
          metadataDrawer.close()
        }
      },
    })

    const openMetadataDrawer = () => {
      const showDelete = !isAddModeRef.current && !!onDelete

      // Returning the promise lets the Button show its loading state while the
      // deletion runs; the drawer only closes once it settles.
      const handleDelete = async () => {
        const result = await onDelete?.()

        if (result !== false) {
          metadataDrawer.close()
        }
      }

      metadataDrawer.open({
        title: translate('text_63fcc3218d35b9377840f59b'),
        // Closing is handled in the form's onSubmit (stay open on a failed save)
        form: { id: ITEM_METADATA_FORM_ID, submit: form.handleSubmit },
        closeOnSubmitSuccess: false,
        cancelOrCloseText: 'cancel',
        shouldPromptOnClose: () => form.state.isDirty,
        onClose: () => form.reset(),
        onEntered: (container) => {
          if (!focusLastKeyInputRef.current) return

          // "Add" intent: focus the key input of the ready-to-type row
          const keyInputs = container.querySelectorAll<HTMLInputElement>('input[id$=".key"]')

          keyInputs[keyInputs.length - 1]?.focus()
        },
        children: <ItemMetadataDrawerContent form={form} description={description} />,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="item-metadata-drawer-save">
              {translate(
                isAddModeRef.current
                  ? 'text_6405cac5c833dcf18cad0196'
                  : 'text_17295436903260tlyb1gp1i7',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        secondaryAction: showDelete ? (
          <Button danger variant="quaternary" onClick={handleDelete}>
            {translate('text_1784637373017e1som6d92em')}
          </Button>
        ) : undefined,
      })
    }

    useImperativeHandle(ref, () => ({
      openDrawer: (values?: ItemMetadataFormValues, opts?: { appendEmptyRow?: boolean }) => {
        isAddModeRef.current = !values?.metadata?.length
        // Focus the empty row on "Add" intent (empty drawer or appended row)
        focusLastKeyInputRef.current = isAddModeRef.current || !!opts?.appendEmptyRow

        if (values?.metadata?.length) {
          // "Add" intent appends a ready-to-type empty row; left empty, it
          // fails the required validation on save like any other row.
          const rows = opts?.appendEmptyRow
            ? [...values.metadata, { key: '', value: '' }]
            : values.metadata

          form.reset({ metadata: rows }, { keepDefaultValues: true })
        } else {
          // Seed one empty row so the user can start typing right away
          form.reset({ metadata: [{ key: '', value: '' }] }, { keepDefaultValues: true })
        }

        openMetadataDrawer()
      },
      closeDrawer: () => {
        metadataDrawer.close()
      },
    }))

    return null
  },
)

ItemMetadataDrawer.displayName = 'ItemMetadataDrawer'
