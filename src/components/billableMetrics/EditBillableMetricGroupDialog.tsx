import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog, WarningDialogMode } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface EditBillableMetricGroupDialogProps {
  mode: WarningDialogMode
  onContinue: () => unknown
  plansCount?: number
  subscriptionsCount?: number
}

export interface EditBillableMetricGroupDialogRef {
  openDialog: ({
    onContinue,
    plansCount,
    subscriptionsCount,
  }: EditBillableMetricGroupDialogProps) => unknown
  closeDialog: () => unknown
}

export const EditBillableMetricGroupDialog = forwardRef<EditBillableMetricGroupDialogRef>(
  (_, ref) => {
    const dialogRef = useRef<DialogRef>(null)
    const { translate } = useInternationalization()
    const [data, setData] = useState<EditBillableMetricGroupDialogProps | undefined>(undefined)

    const { mode, onContinue, plansCount, subscriptionsCount } = data || {}

    useImperativeHandle(ref, () => ({
      openDialog: (infos) => {
        setData(infos)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <WarningDialog
        mode={mode}
        ref={dialogRef}
        title={translate('text_64f2044bd3655501184fe142')}
        description={
          mode === WarningDialogMode.danger ? (
            translate('text_64f1e90251fc8c40b9174943', { plansCount, subscriptionsCount })
          ) : (
            <>
              {translate('text_64f2044bd3655501184fe143', { plansCount, subscriptionsCount })}
              <ul>
                <li>{translate('text_64f2044bd3655501184fe144')}</li>
                <li>{translate('text_64f2044bd3655501184fe145')}</li>
              </ul>
            </>
          )
        }
        onContinue={async () => onContinue && onContinue()}
        continueText={translate('text_64f2044bd3655501184fe147')}
      />
    )
  }
)

EditBillableMetricGroupDialog.displayName = 'EditBillableMetricGroupDialog'
