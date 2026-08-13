import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
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
    displayName
  }

  mutation deleteCustomerGracePeriod($input: UpdateCustomerInvoiceGracePeriodInput!) {
    updateCustomerInvoiceGracePeriod(input: $input) {
      id
      invoiceGracePeriod
    }
  }
`

type DeleteCustomerGracePeriodeDialogData = {
  customer: DeleteCustomerGracePeriodFragment
}

export const useDeleteCustomerGracePeriodeDialog = (): {
  openDeleteCustomerGracePeriodeDialog: (data: DeleteCustomerGracePeriodeDialogData) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

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

  const openDeleteCustomerGracePeriodeDialog = ({
    customer,
  }: DeleteCustomerGracePeriodeDialogData): void => {
    centralizedDialog.open({
      title: translate('text_63aa085d28b8510cd464417b'),
      description: (
        <Typography
          html={translate('text_63aa085d28b8510cd464418d', {
            name: customer?.displayName,
          })}
        />
      ),
      colorVariant: 'danger',
      actionText: translate('text_63aa085d28b8510cd46441a5'),
      onAction: async () => {
        await deleteGracePeriode({
          variables: { input: { id: customer?.id, invoiceGracePeriod: null } },
        })
      },
    })
  }

  return { openDeleteCustomerGracePeriodeDialog }
}
