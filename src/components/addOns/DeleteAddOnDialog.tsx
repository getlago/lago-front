import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteAddOnFragment, useDeleteAddOnMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteAddOn on AddOn {
    id
    name
  }

  mutation deleteAddOn($input: DestroyAddOnInput!) {
    destroyAddOn(input: $input) {
      id
    }
  }
`

interface DeleteAddOnDialogProps {
  addOn: DeleteAddOnFragment
  callback?: () => void
}

export interface DeleteAddOnDialogRef {
  openDialog: ({ addOn, callback }: DeleteAddOnDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteAddOnDialog = forwardRef<DeleteAddOnDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<DeleteAddOnDialogProps | undefined>(undefined)

  const { id = '', name = '' } = localData?.addOn || {}

  const [deleteAddOn] = useDeleteAddOnMutation({
    onCompleted(data) {
      if (data && data.destroyAddOn) {
        addToast({
          message: translate('text_629728388c4d2300e2d3815f'),
          severity: 'success',
        })

        localData?.callback && localData.callback()
      }
    },
    refetchQueries: ['addOns'],
  })

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
    <WarningDialog
      ref={dialogRef}
      title={translate('text_629728388c4d2300e2d380ad', {
        addOnName: name,
      })}
      description={<Typography html={translate('text_629728388c4d2300e2d380c5')} />}
      onContinue={async () =>
        await deleteAddOn({
          variables: { input: { id: id || '' } },
        })
      }
      continueText={translate('text_629728388c4d2300e2d380f5')}
    />
  )
})

DeleteAddOnDialog.displayName = 'DeleteAddOnDialog'
