import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  useDestroyNangoIntegrationMutation
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'



type TDeleteHubspotIntegrationDialogProps = {
  provider: any
  callback?: Function
}

export interface DeleteHubspotIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteHubspotIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteHubspotIntegrationDialog = forwardRef<DeleteHubspotIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteHubspotIntegrationDialogProps | undefined>(
      undefined,
    )
    const netsuiteProvider = localData?.provider

    const [deleteNetsuite] = useDestroyNangoIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyIntegration) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_661ff6e56ef7e1b7c542b2f9'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `NetsuiteProvider:${netsuiteProvider?.id}` })
      },
      refetchQueries: ['getNetsuiteIntegrationsList'],
    })

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_658461066530343fe1808cd7', { name: netsuiteProvider?.name })}
        description={translate('text_661ff6e56ef7e1b7c542b1ec')}
        onContinue={async () =>
          await deleteNetsuite({ variables: { input: { id: netsuiteProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteHubspotIntegrationDialog.displayName = 'DeleteHubspotIntegrationDialog'
