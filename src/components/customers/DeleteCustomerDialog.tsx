import { gql } from '@apollo/client'
import { forwardRef } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteCustomerDialogFragment, useDeleteCustomerMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCustomerDialog on Customer {
    id
    name
  }

  mutation deleteCustomer($input: DestroyCustomerInput!) {
    destroyCustomer(input: $input) {
      id
    }
  }
`

export interface DeleteCustomerDialogRef extends WarningDialogRef {}

interface DeleteCustomerDialogProps {
  customer: DeleteCustomerDialogFragment
  onDeleted?: () => void
}

export const DeleteCustomerDialog = forwardRef<DialogRef, DeleteCustomerDialogProps>(
  ({ customer, onDeleted }: DeleteCustomerDialogProps, ref) => {
    const [deleteCustomer] = useDeleteCustomerMutation({
      onCompleted(data) {
        if (data && data.destroyCustomer) {
          onDeleted && onDeleted()
          addToast({
            message: translate('text_626162c62f790600f850b814'),
            severity: 'success',
          })
        }
      },
      update(cache, { data }) {
        if (!data?.destroyCustomer) return

        const cacheId = cache.identify({
          id: data?.destroyCustomer.id,
          __typename: 'Customer',
        })

        cache.evict({ id: cacheId })
      },
    })
    const { translate } = useInternationalization()

    return (
      <WarningDialog
        ref={ref}
        title={translate('text_626162c62f790600f850b6e8', {
          customerFullName: customer?.name || translate('text_651a8ab50fd34e005d1c1dc7'),
        })}
        description={<Typography html={translate('text_626162c62f790600f850b6f8')} />}
        onContinue={async () =>
          await deleteCustomer({
            variables: { input: { id: customer?.id } },
          })
        }
        continueText={translate('text_626162c62f790600f850b712')}
      />
    )
  },
)

DeleteCustomerDialog.displayName = 'DeleteCustomerDialog'
