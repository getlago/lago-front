import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteFlutterwaveIntegrationDialogFragment,
  useDeleteFlutterwaveIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteFlutterwaveIntegrationDialog on FlutterwaveProvider {
    id
    name
  }
  mutation deleteFlutterwaveIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteFlutterwaveIntegrationDialogProps = {
  provider: DeleteFlutterwaveIntegrationDialogFragment | null
  callback?: () => void
}

export interface DeleteFlutterwaveIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteFlutterwaveIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteFlutterwaveIntegrationDialog = forwardRef<DeleteFlutterwaveIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<
      TDeleteFlutterwaveIntegrationDialogProps | undefined
    >(undefined)
    const flutterwaveProvider = localData?.provider

    const [deleteFlutterwave] = useDeleteFlutterwaveIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_1749799070145axw96s27789'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `FlutterwaveProvider:${flutterwaveProvider?.id}` })
      },
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
        mode="danger"
        ref={dialogRef}
        title={translate('text_1749799070145vfvz9sq757a', {
          name: flutterwaveProvider?.name,
        })}
        description={translate('text_1749799070145zdncdpo3g37')}
        onContinue={async () =>
          await deleteFlutterwave({
            variables: { input: { id: flutterwaveProvider?.id as string } },
          })
        }
        continueText={translate('text_1749799070145czycjo9guoq')}
      />
    )
  },
)

DeleteFlutterwaveIntegrationDialog.displayName = 'DeleteFlutterwaveIntegrationDialog'
