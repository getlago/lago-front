import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteCustomSectionFragment, useDeleteCustomSectionMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomSection on InvoiceCustomSection {
    id
  }

  mutation deleteCustomSection($input: DestroyInvoiceCustomSectionInput!) {
    destroyInvoiceCustomSection(input: $input) {
      id
    }
  }
`

export interface DeleteCustomSectionDialogRef {
  openDialog: (customSection: DeleteCustomSectionFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteCustomSectionDialog = forwardRef<DeleteCustomSectionDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [customSection, setCustomSection] = useState<DeleteCustomSectionFragment>()

  const [deleteCustomSection] = useDeleteCustomSectionMutation({
    onCompleted(data) {
      if (data && data.destroyInvoiceCustomSection) {
        addToast({
          message: translate('text_1733849149914twslm71nuy6'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyInvoiceCustomSection) return
      const cacheId = cache.identify({
        id: data?.destroyInvoiceCustomSection.id,
        __typename: 'InvoiceCustomSection',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setCustomSection(data)
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
      onContinue={async () =>
        await deleteCustomSection({
          variables: {
            input: {
              id: customSection?.id || '',
            },
          },
        })
      }
      continueText={translate('text_1732639603661uwmv1793v9b')}
    />
  )
})

DeleteCustomSectionDialog.displayName = 'DeleteCustomSectionDialog'
