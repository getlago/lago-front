import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteHubspotIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteHubspotIntegrationDialog on HubspotIntegration {
    id
    name
  }

  mutation destroyNangoIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteHubspotIntegrationDialogProps = {
  provider: DeleteHubspotIntegrationDialogFragment | null
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
    const hubspotProvider = localData?.provider

    const [deleteHubspot] = useDestroyNangoIntegrationMutation({
      onCompleted(data) {
        if (data.destroyIntegration) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_661ff6e56ef7e1b7c542b2f9'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `HubspotProvider:${hubspotProvider?.id}` })
      },
      refetchQueries: ['getHubspotIntegrationsList'],
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
        title={translate('text_658461066530343fe1808cd7', {
          name: hubspotProvider?.name,
        })}
        description={translate('text_1727453876790u9azb7rvhox')}
        onContinue={async () =>
          await deleteHubspot({
            variables: {
              input: {
                id: hubspotProvider?.id as string,
              },
            },
          })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteHubspotIntegrationDialog.displayName = 'DeleteHubspotIntegrationDialog'
