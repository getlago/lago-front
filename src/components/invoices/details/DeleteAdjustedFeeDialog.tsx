import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { useDestroyAdjustedFeeMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FeeForDeleteAdjustmentFeeDialog on Fee {
    id
  }

  mutation destroyAdjustedFee($input: DestroyAdjustedFeeInput!) {
    destroyAdjustedFee(input: $input) {
      id
    }
  }
`

interface DeleteAdjustedFeeDialogProps {
  fee: TExtendedRemainingFee | undefined
}

export interface DeleteAdjustedFeeDialogRef {
  openDialog: (dialogData: DeleteAdjustedFeeDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAdjustedFeeDialog = forwardRef<DeleteAdjustedFeeDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<WarningDialogRef>(null)
  const [dialogData, setDialogData] = useState<DeleteAdjustedFeeDialogProps | undefined>(undefined)

  const [destroyFee] = useDestroyAdjustedFeeMutation({
    onCompleted({ destroyAdjustedFee }) {
      if (destroyAdjustedFee?.id) {
        dialogRef.current?.closeDialog()
      }
    },
    refetchQueries: ['getInvoiceDetails'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setDialogData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_65a6b4e2cb38d9b70ec54035')}
      description={<Typography>{translate('text_65a6b4e2cb38d9b70ec53c55')}</Typography>}
      onContinue={async () => {
        await destroyFee({
          variables: {
            input: {
              id: dialogData?.fee?.id || '',
            },
          },
        })
      }}
      continueText={translate('text_65a6b4e2cb38d9b70ec53c67')}
    />
  )
})

DeleteAdjustedFeeDialog.displayName = 'DeleteAdjustedFeeDialog'
