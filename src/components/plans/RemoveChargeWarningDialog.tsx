import { FormikProps } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanFormInput } from './types'

export interface RemoveChargeWarningDialogRef {
  openDialog: (index: number) => unknown
  closeDialog: () => unknown
}

interface RemoveChargeWarningDialogProps {
  formikProps: FormikProps<PlanFormInput>
}

export const RemoveChargeWarningDialog = forwardRef<
  RemoveChargeWarningDialogRef,
  RemoveChargeWarningDialogProps
>(({ formikProps }: RemoveChargeWarningDialogProps, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const [creditNoteIndex, setCreditNoteIndex] = useState<number | undefined>(undefined)
  const { translate } = useInternationalization()

  useImperativeHandle(ref, () => ({
    openDialog: (index) => {
      setCreditNoteIndex(index)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_63cfe20ad6c1a53c5352a46e')}
      description={translate('text_63cfe20ad6c1a53c5352a470')}
      continueText={translate('text_63cfe20ad6c1a53c5352a474')}
      onContinue={() => {
        const charges = [...formikProps.values.charges]

        if (typeof creditNoteIndex === 'number') charges.splice(creditNoteIndex, 1)

        formikProps.setFieldValue('charges', charges)
      }}
    />
  )
})

RemoveChargeWarningDialog.displayName = 'RemoveChargeWarningDialog'
