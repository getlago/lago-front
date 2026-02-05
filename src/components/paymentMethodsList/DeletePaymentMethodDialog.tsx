import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/designSystem'
import { DestroyPaymentMethodInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

interface DeletePaymentMethodDialogProps {
  paymentMethod?: PaymentMethodItem
  onConfirm: (input: DestroyPaymentMethodInput) => Promise<void>
}

export interface DeletePaymentMethodDialogRef {
  openDialog: (data: DeletePaymentMethodDialogProps) => void
  closeDialog: () => void
}

export const DeletePaymentMethodDialog = forwardRef<DeletePaymentMethodDialogRef, unknown>(
  (_props, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<DeletePaymentMethodDialogProps | undefined>(
      undefined,
    )

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    const handleConfirm = async (): Promise<void> => {
      if (!localData?.paymentMethod) return

      await localData.onConfirm({ id: localData.paymentMethod.id })

      dialogRef.current?.closeDialog()
    }

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_1762437511802sg9jrl46lkb')}
        description={translate('text_17625350067233oa8biywazm')}
        onContinue={handleConfirm}
        continueText={translate('text_1762437511802sg9jrl46lkb')}
        mode="danger"
      />
    )
  },
)

DeletePaymentMethodDialog.displayName = 'DeletePaymentMethodDialog'
