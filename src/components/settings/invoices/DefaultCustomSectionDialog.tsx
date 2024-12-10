import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ActionType = 'setDefault' | 'removeDefault'

type TDefaultCustomSectionDialogProps = {
  type: ActionType
  onConfirm: () => void
  onCancel?: () => void
}

export interface DefaultCustomSectionDialogRef {
  openDialog: (props: TDefaultCustomSectionDialogProps) => unknown
  closeDialog: () => unknown
}

export const DefaultCustomSectionDialog = forwardRef<DefaultCustomSectionDialogRef, unknown>(
  (_props, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [localData, setLocalData] = useState<TDefaultCustomSectionDialogProps>()

    useImperativeHandle(ref, () => ({
      openDialog: (props) => {
        setLocalData(props)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        setLocalData(undefined)
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={
          localData?.type === 'setDefault'
            ? translate('text_1732634307286ij3e2kb6c4v')
            : translate('text_1732634307286y0yb9lyb70f')
        }
        description={translate(
          localData?.type === 'setDefault'
            ? 'text_17326343072869mt7lostpsa'
            : 'text_1732634307286joro3vhe88v',
        )}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={async () => {
                await localData?.onCancel?.()
                closeDialog()
              }}
            >
              {translate('text_62728ff857d47b013204c7e4')}
            </Button>

            <Button
              variant="primary"
              onClick={async () => {
                await localData?.onConfirm()
                closeDialog()
              }}
              data-test="set-invoice-default-section"
            >
              {localData?.type === 'setDefault'
                ? translate('text_1728574726495n9jdse2hnrf')
                : translate('text_1728575305796o7kwackkbj6')}
            </Button>
          </>
        )}
        data-test="set-invoice-default-section-dialog"
      />
    )
  },
)

DefaultCustomSectionDialog.displayName = 'DefaultCustomSectionDialog'
