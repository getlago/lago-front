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

export interface DeleteAddOnDialogRef {
  openDialog: (addOn: DeleteAddOnFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteAddOnDialog = forwardRef<DeleteAddOnDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [addOn, setAddOn] = useState<DeleteAddOnFragment | undefined>(undefined)
  const [deleteAddOn] = useDeleteAddOnMutation({
    onCompleted(data) {
      if (data && data.destroyAddOn) {
        addToast({
          message: translate('text_629728388c4d2300e2d3815f'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyAddOn) return
      const cacheId = cache.identify({
        id: data?.destroyAddOn.id,
        __typename: 'AddOn',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setAddOn(data)
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
        addOnName: addOn?.name,
      })}
      description={<Typography html={translate('text_629728388c4d2300e2d380c5')} />}
      onContinue={async () =>
        await deleteAddOn({
          variables: { input: { id: addOn?.id || '' } },
        })
      }
      continueText={translate('text_629728388c4d2300e2d380f5')}
    />
  )
})

DeleteAddOnDialog.displayName = 'DeleteAddOnDialog'
