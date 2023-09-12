import { gql } from '@apollo/client'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useDeleteAdyenMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation deleteAdyen($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

export interface DeleteAdyenIntegrationDialogRef extends WarningDialogRef {}

interface DeleteAdyenIntegrationDialogProps {
  id: string
}

export const DeleteAdyenIntegrationDialog = forwardRef<
  DialogRef,
  DeleteAdyenIntegrationDialogProps
>(({ id }: DeleteAdyenIntegrationDialogProps, ref) => {
  const navigate = useNavigate()
  const [deleteAdyen] = useDeleteAdyenMutation({
    onCompleted(data) {
      if (data && data.destroyPaymentProvider) {
        navigate(INTEGRATIONS_ROUTE)
        addToast({
          message: translate('text_645d071272418a14c1c76b25'),
          severity: 'success',
        })
      }
    },
  })
  const { translate } = useInternationalization()

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_645d071272418a14c1c76a5d')}
      description={<Typography html={translate('text_645d071272418a14c1c76a69')} />}
      onContinue={async () => await deleteAdyen({ variables: { input: { id } } })}
      continueText={translate('text_645d071272418a14c1c76a81')}
    />
  )
})

DeleteAdyenIntegrationDialog.displayName = 'DeleteAdyenIntegrationDialog'
