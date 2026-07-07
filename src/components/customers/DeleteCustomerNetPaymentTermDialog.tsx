import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCustomerNetPaymentTermFragment,
  useDeleteCustomerNetPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerNetPaymentTerm on Customer {
    id
    externalId
    name
    displayName
    netPaymentTerm
  }

  mutation deleteCustomerNetPaymentTerm($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...DeleteCustomerNetPaymentTerm
    }
  }
`

type DeleteCustomerNetPaymentTermDialogData = {
  customer: DeleteCustomerNetPaymentTermFragment
}

export const useDeleteCustomerNetPaymentTermDialog = (): {
  openDeleteCustomerNetPaymentTermDialog: (data: DeleteCustomerNetPaymentTermDialogData) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteCustomerNetPaymentTerm] = useDeleteCustomerNetPaymentTermMutation({
    onCompleted(data) {
      if (data && data.updateCustomer) {
        addToast({
          message: translate('text_64c7a89b6c67eb6c98898357'),
          severity: 'success',
        })
      }
    },
  })

  const openDeleteCustomerNetPaymentTermDialog = ({
    customer,
  }: DeleteCustomerNetPaymentTermDialogData): void => {
    centralizedDialog.open({
      title: translate('text_64c7a89b6c67eb6c988980db'),
      description: (
        <Typography
          html={translate('text_64c7a89b6c67eb6c988980f9', {
            customerName: `<span class="line-break-anywhere">${customer?.displayName}</span>`,
          })}
        />
      ),
      colorVariant: 'danger',
      actionText: translate('text_64c7a89b6c67eb6c98898133'),
      onAction: async () => {
        await deleteCustomerNetPaymentTerm({
          variables: {
            input: {
              id: customer.id,
              netPaymentTerm: null,
              externalId: customer.externalId,
              name: customer.name || '',
            },
          },
        })
      },
    })
  }

  return { openDeleteCustomerNetPaymentTermDialog }
}
