import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteCustomerPaymentTermFragment,
  useDeleteCustomerPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerPaymentTerm on Customer {
    id
    externalId
    name
    displayName
    paymentTerm {
      termType
      days
      dayOfMonth
      monthOffset
    }
  }

  mutation deleteCustomerPaymentTerm($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...DeleteCustomerPaymentTerm
    }
  }
`

type DeleteCustomerPaymentTermDialogData = {
  customer: DeleteCustomerPaymentTermFragment
}

export const useDeleteCustomerPaymentTermDialog = (): {
  openDeleteCustomerPaymentTermDialog: (data: DeleteCustomerPaymentTermDialogData) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [deleteCustomerPaymentTerm] = useDeleteCustomerPaymentTermMutation({
    onCompleted(data) {
      if (data && data.updateCustomer) {
        addToast({
          message: translate('text_1787603382163macepxq32tf'),
          severity: 'success',
        })
      }
    },
  })

  const openDeleteCustomerPaymentTermDialog = ({
    customer,
  }: DeleteCustomerPaymentTermDialogData): void => {
    centralizedDialog.open({
      title: translate('text_1787603382163xl4mmi1owjh'),
      description: (
        <Typography
          html={translate('text_1787603382163x1yp1dfhgcb', {
            customerName: `<span class="line-break-anywhere">${customer?.displayName}</span>`,
          })}
        />
      ),
      colorVariant: 'danger',
      actionText: translate('text_64c7a89b6c67eb6c98898133'),
      onAction: async () => {
        // Clearing the term makes the customer inherit from the billing entity again.
        await deleteCustomerPaymentTerm({
          variables: {
            input: {
              id: customer.id,
              paymentTerm: null,
              externalId: customer.externalId,
              name: customer.name || '',
            },
          },
        })
      },
    })
  }

  return { openDeleteCustomerPaymentTermDialog }
}
