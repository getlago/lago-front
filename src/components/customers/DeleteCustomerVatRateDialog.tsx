import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import {
  useDeleteCustomerVatRateMutation,
  DeleteCustomerVatRateFragment,
} from '~/generated/graphql'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

gql`
  mutation deleteCustomerVatRate($input: UpdateCustomerVatRateInput!) {
    updateCustomerVatRate(input: $input) {
      id
      vatRate
    }
  }

  fragment DeleteCustomerVatRate on CustomerDetails {
    id
    name
  }
`

export interface DeleteCustomerVatRateDialogRef extends WarningDialogRef {}

interface DeleteCustomerVatRateDialogProps {
  customer: DeleteCustomerVatRateFragment
}

export const DeleteCustomerVatRateDialog = forwardRef<DialogRef, DeleteCustomerVatRateDialogProps>(
  ({ customer }: DeleteCustomerVatRateDialogProps, ref) => {
    const [deleteVatRate] = useDeleteCustomerVatRateMutation({
      onCompleted(data) {
        if (data && data.updateCustomerVatRate) {
          addToast({
            message: translate('text_63aa133120b6534f5de3462e'),
            severity: 'success',
          })
        }
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_63aa085d28b8510cd4644181')}
        description={
          <Typography
            html={translate('text_63aa085d28b8510cd4644187', {
              name: customer?.name,
            })}
          />
        }
        onContinue={async () =>
          await deleteVatRate({
            variables: { input: { id: customer?.id, vatRate: null } },
          })
        }
        continueText={translate('text_63aa085d28b8510cd464419f')}
      />
    )
  }
)

DeleteCustomerVatRateDialog.displayName = 'DeleteCustomerVatRateDialog'
