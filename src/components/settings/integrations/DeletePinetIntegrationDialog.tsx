import { gql } from '@apollo/client'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useDeletePinetMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation deletePinet($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

export interface DeletePinetIntegrationDialogRef extends WarningDialogRef { }

interface DeletePinetIntegrationDialogProps {
  id: string
}

export const DeletePinetIntegrationDialog = forwardRef<
  DialogRef,
  DeletePinetIntegrationDialogProps
>(({ id }: DeletePinetIntegrationDialogProps, ref) => {
  const navigate = useNavigate()
  const [deletePinet] = useDeletePinetMutation({
    onCompleted(data) {
      if (data && data.destroyPaymentProvider) {
        navigate(INTEGRATIONS_ROUTE)
        addToast({
          message: 'PINET API secret key successfully deleted',
          severity: 'success',
        })
      }
    },
  })
  const { translate } = useInternationalization()

  return (
    <WarningDialog
      ref={ref}
      title={'Delete PINET API secret key'}
      description={
        <Typography
          html={
            'By deleting the API secret key, the existing connection will not be used anymore and upcoming data will not be synchronised to the connected PINET account. Are you sure?'
          }
        />
      }
      onContinue={async () => await deletePinet({ variables: { input: { id } } })}
      continueText={translate('text_62b1edddbf5f461ab971270f')}
    />
  )
})

DeletePinetIntegrationDialog.displayName = 'DeletePinetIntegrationDialog'
