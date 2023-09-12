import { gql } from '@apollo/client'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { useDeleteStripeMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation deleteStripe($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

export interface DeleteStripeIntegrationDialogRef extends WarningDialogRef {}

interface DeleteStripeIntegrationDialogProps {
  id: string
}

export const DeleteStripeIntegrationDialog = forwardRef<
  DialogRef,
  DeleteStripeIntegrationDialogProps
>(({ id }: DeleteStripeIntegrationDialogProps, ref) => {
  const navigate = useNavigate()
  const [deleteStripe] = useDeleteStripeMutation({
    onCompleted(data) {
      if (data && data.destroyPaymentProvider) {
        navigate(INTEGRATIONS_ROUTE)
        addToast({
          message: translate('text_62b1edddbf5f461ab9712758'),
          severity: 'success',
        })
      }
    },
  })
  const { translate } = useInternationalization()

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_62b1edddbf5f461ab97126e4')}
      description={<Typography html={translate('text_62b1edddbf5f461ab97126f0')} />}
      onContinue={async () => await deleteStripe({ variables: { input: { id } } })}
      continueText={translate('text_62b1edddbf5f461ab971270f')}
    />
  )
})

DeleteStripeIntegrationDialog.displayName = 'DeleteStripeIntegrationDialog'
