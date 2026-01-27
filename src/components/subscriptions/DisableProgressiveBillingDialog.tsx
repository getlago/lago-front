import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type DisableProgressiveBillingDialogProps = {
  subscriptionId: string
  subscriptionName: string
}

export interface DisableProgressiveBillingDialogRef {
  openDialog: (data: DisableProgressiveBillingDialogProps) => void
  closeDialog: () => void
}

export const DisableProgressiveBillingDialog = forwardRef<DisableProgressiveBillingDialogRef>(
  (_, ref) => {
    const dialogRef = useRef<DialogRef>(null)
    const { translate } = useInternationalization()
    const [localData, setLocalData] = useState<DisableProgressiveBillingDialogProps | null>(null)

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate('text_1738071730498n89s1p0z8b4')}
        description={
          <Typography
            variant="body"
            color="grey600"
            html={translate('text_1738071730498xnl4qgvmzeo', {
              subscriptionName: localData?.subscriptionName,
            })}
          />
        }
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <Button
              variant="primary"
              danger
              onClick={() => {
                // TODO: LAGO-1109 - Implement disable mutation
                closeDialog()
              }}
            >
              {translate('text_1738071730498bsjvn56ruzp')}
            </Button>
          </>
        )}
      />
    )
  },
)

DisableProgressiveBillingDialog.displayName = 'DisableProgressiveBillingDialog'
