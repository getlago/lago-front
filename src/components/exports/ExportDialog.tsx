import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { ExportValues } from '~/components/exports/types'
import {
  CreditNoteExportTypeEnum,
  DataExportFormatTypeEnum,
  InvoiceExportTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCurrentUser } from '~/hooks/useCurrentUser'

type ExportTypeEnum = CreditNoteExportTypeEnum | InvoiceExportTypeEnum

export type OpenExportDialogArgs<T extends ExportTypeEnum = ExportTypeEnum> = {
  totalCountLabel: string
  onExport: (values: ExportValues<T>) => void | Promise<void>
  disableExport?: boolean
  resourceTypeOptions: {
    label: string
    sublabel: string
    value: T
  }[]
}

const FORM_ID = 'export-form'

const exportValidationSchema = z.object({
  format: z.enum(DataExportFormatTypeEnum),
  resourceType: z.union([z.enum(CreditNoteExportTypeEnum), z.enum(InvoiceExportTypeEnum)]),
})

export const useExportDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const { currentUser } = useCurrentUser()
  const onExportRef = useRef<
    ((values: ExportValues<ExportTypeEnum>) => void | Promise<void>) | null
  >(null)

  const form = useAppForm({
    defaultValues: {
      format: DataExportFormatTypeEnum.Csv as DataExportFormatTypeEnum,
      resourceType: InvoiceExportTypeEnum.Invoices as ExportTypeEnum,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: exportValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onExportRef.current?.({
        format: value.format,
        resourceType: value.resourceType,
      })
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    await form.handleSubmit()

    if (!form.state.isSubmitSuccessful) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openExportDialog = <T extends ExportTypeEnum>({
    totalCountLabel,
    onExport,
    disableExport = false,
    resourceTypeOptions,
  }: OpenExportDialogArgs<T>) => {
    onExportRef.current = onExport as (values: ExportValues<ExportTypeEnum>) => void | Promise<void>
    form.reset()
    form.setFieldValue('format', DataExportFormatTypeEnum.Csv)
    form.setFieldValue('resourceType', resourceTypeOptions[0].value)

    formDialog
      .open({
        title: translate('text_66b21236c939426d07ff9930'),
        description: translate('text_66b21236c939426d07ff9932'),
        children: (
          <div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3 p-6">
              <Typography variant="caption" color="grey600">
                {translate('text_6419c64eace749372fc72b27')}
              </Typography>
              <Typography variant="body" color="grey700">
                {currentUser?.email}
              </Typography>

              <Typography variant="caption" color="grey600">
                {translate('text_66b21236c939426d07ff9936')}
              </Typography>
              <Typography variant="body" color="grey700">
                {translate('text_66b21236c939426d07ff9935')}
              </Typography>

              <Typography variant="caption" color="grey600">
                {translate('text_66b21236c939426d07ff9938')}
              </Typography>
              <Typography variant="body" color="grey700">
                {totalCountLabel}
              </Typography>
            </div>

            <div className="w-full border-b border-grey-300" />

            <div className="p-6">
              <div className="mb-4">
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_66b21236c939426d07ff9939')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_66b21236c939426d07ff993a')}
                </Typography>
              </div>

              <form.AppField name="resourceType">
                {(field) => (
                  <field.RadioGroupField
                    optionsGapSpacing={4}
                    optionLabelVariant="body"
                    options={resourceTypeOptions}
                  />
                )}
              </form.AppField>
            </div>
          </div>
        ),
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton variant="primary" disabled={disableExport}>
              {translate('text_66b21236c939426d07ff9940')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: FORM_ID,
          submit: handleSubmit,
        },
      })
      .then(() => {
        form.reset()
        onExportRef.current = null
      })
  }

  return { openExportDialog }
}
