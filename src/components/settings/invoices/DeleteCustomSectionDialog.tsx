import { forwardRef, useImperativeHandle, useRef } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { WarningDialog } from '../../WarningDialog'

export interface DeleteCustomSectionDialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

export const DeleteCustomSectionDialog = forwardRef<DeleteCustomSectionDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)

  useImperativeHandle(ref, () => ({
    openDialog: () => {
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_1732639579760vrvtea9dbua')}
      description={<Typography>{translate('text_1732639579760siwe29e2rqg')}</Typography>}
      // TODO: Implement deletion
      onContinue={async () => {}}
      continueText={translate('text_1732639603661uwmv1793v9b')}
    />
  )
})

DeleteCustomSectionDialog.displayName = 'DeleteCustomSectionDialog'
