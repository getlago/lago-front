import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteSalesforceIntegrationDialogFragment,
  useDestroyNangoIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteSalesforceIntegrationDialog on SalesforceIntegration {
    id
    name
  }

  mutation destroyNangoIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type TDeleteSalesforceIntegrationDialogProps = {
  provider: DeleteSalesforceIntegrationDialogFragment | null
  callback?: (arg?: unknown) => void
}

export interface DeleteSalesforceIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteSalesforceIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteSalesforceIntegrationDialog = forwardRef<DeleteSalesforceIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteSalesforceIntegrationDialogProps | undefined>(
      undefined,
    )
    const salesforceProvider = localData?.provider

    const [deleteSalesforce] = useDestroyNangoIntegrationMutation({
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
        cache.evict({ id: `SalesforceProvider:${salesforceProvider?.id}` })
      },
      refetchQueries: ['getSalesforceIntegrationsList'],
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
          name: salesforceProvider?.name,
        })}
        description={translate('text_1731511951723v0hq5fotjrx')}
        onContinue={async () =>
          await deleteSalesforce({
            variables: {
              input: {
                id: salesforceProvider?.id as string,
              },
            },
          })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteSalesforceIntegrationDialog.displayName = 'DeleteSalesforceIntegrationDialog'
