import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCustomerGracePeriodFragment,
  useDeleteCustomerGracePeriodMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerGracePeriod on Customer {
    id
    name
  }

  mutation deleteCustomerGracePeriod($input: UpdateCustomerInvoiceGracePeriodInput!) {
    updateCustomerInvoiceGracePeriod(input: $input) {
      id
      invoiceGracePeriod
    }
  }
`

export interface DeleteCustomerGracePeriodeDialogRef extends WarningDialogRef {}

interface DeleteCustomerGracePeriodeDialogProps {
  customer: DeleteCustomerGracePeriodFragment
}

export const DeleteCustomerGracePeriodeDialog = forwardRef<
  DialogRef,
  DeleteCustomerGracePeriodeDialogProps
>(({ customer }: DeleteCustomerGracePeriodeDialogProps, ref) => {
  const [deleteGracePeriode] = useDeleteCustomerGracePeriodMutation({
    onCompleted(data) {
      if (data && data.updateCustomerInvoiceGracePeriod) {
        addToast({
          message: translate('text_63aa133120b6534f5de34629'),
          severity: 'success',
        })
      }
    },
  })
  const { translate } = useInternationalization()

  return (
    <WarningDialog
      ref={ref}
      title={translate('text_63aa085d28b8510cd464417b')}
      description={
        <Typography
          html={translate('text_63aa085d28b8510cd464418d', {
            name: customer?.name,
          })}
        />
      }
      onContinue={async () =>
        await deleteGracePeriode({
          variables: { input: { id: customer?.id, invoiceGracePeriod: null } },
        })
      }
      continueText={translate('text_63aa085d28b8510cd46441a5')}
    />
  )
})

DeleteCustomerGracePeriodeDialog.displayName = 'DeleteCustomerGracePeriodeDialog'
