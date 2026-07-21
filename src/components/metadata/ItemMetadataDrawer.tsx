import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { useDrawer } from '~/components/drawers/useDrawer'
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

const itemMetadataSchema = z.object({
  metadata: zodMetadataSchema(ITEM_METADATA_VALUE_MAX_LENGTH, ITEM_METADATA_KEY_MAX_LENGTH),
})

export interface ItemMetadataDrawerRef {
  openDrawer: (values?: ItemMetadataFormValues) => void
  closeDrawer: () => void
}

interface ItemMetadataDrawerProps {
  // Owner-specific copy shown under the drawer title, e.g.
  // "Store custom key-value pairs on this plan."
  description: string
  onSave: (values: ItemMetadataFormValues) => void | boolean | Promise<void | boolean>
  onDelete?: () => void
}

export const ItemMetadataDrawer = forwardRef<ItemMetadataDrawerRef, ItemMetadataDrawerProps>(
  ({ description, onSave, onDelete }, ref) => {
    const { translate } = useInternationalization()
    const metadataDrawer = useDrawer()
    const isAddModeRef = useRef(true)

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

      const handleDelete = () => {
        metadataDrawer.close()
        onDelete?.()
      }

      metadataDrawer.open({
        title: translate('text_63fcc3218d35b9377840f59b'),
        shouldPromptOnClose: () => form.state.isDirty,
        onClose: () => form.reset(),
        children: <ItemMetadataDrawerContent form={form} description={description} />,
        actions: (
          <div
            className={tw(
              'flex items-center gap-3',
              showDelete ? 'w-full justify-between' : 'justify-end',
            )}
          >
            {showDelete && (
              <Button danger variant="quaternary" onClick={handleDelete}>
                {translate('text_63ea0f84f400488553caa786')}
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button variant="quaternary" onClick={() => metadataDrawer.close()}>
                {translate('text_6411e6b530cb47007488b027')}
              </Button>
              <form.Subscribe selector={({ canSubmit }) => canSubmit}>
                {(canSubmit) => (
                  <Button
                    data-test="item-metadata-drawer-save"
                    onClick={() => form.handleSubmit()}
                    disabled={!canSubmit}
                  >
                    {translate(
                      isAddModeRef.current
                        ? 'text_6405cac5c833dcf18cad0196'
                        : 'text_17295436903260tlyb1gp1i7',
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        ),
      })
    }

    useImperativeHandle(ref, () => ({
      openDrawer: (values?: ItemMetadataFormValues) => {
        isAddModeRef.current = !values?.metadata?.length

        if (values?.metadata?.length) {
          form.reset(values, { keepDefaultValues: true })
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
