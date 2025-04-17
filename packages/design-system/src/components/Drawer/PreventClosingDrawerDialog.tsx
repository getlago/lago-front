import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '../Dialog'
import { WarningDialog } from '../WarningDialog'

type PreventClosingDrawerDialogProps = {
  onContinue: () => void
}

export interface PreventClosingDrawerDialogRef {
  openDialog: (props: PreventClosingDrawerDialogProps) => unknown
  closeDialog: () => unknown
}

export const PreventClosingDrawerDialog = forwardRef<PreventClosingDrawerDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<PreventClosingDrawerDialogProps | null>(null)

  useImperativeHandle(ref, () => ({
    openDialog: (taxRateData) => {
      setLocalData(taxRateData)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      // TODO: Handle translation
      title="Leaving without saving"
      description="By clicking 'Leave', any unsaved data will be lost. Are you sure you want to continue?"
      continueText="Leave"
      // title={translate('text_665deda4babaf700d603ea13')}
      // description={translate('text_665dedd557dc3c00c62eb83d')}
      // continueText={translate('text_645388d5bdbd7b00abffa033')}
      onCancel={async () => {
        dialogRef.current?.closeDialog()
      }}
      onContinue={async () => {
        localData?.onContinue()
      }}
    />
  )
})

PreventClosingDrawerDialog.displayName = 'forwardRef'
