import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteBillingEntityVatRateFragment,
  LagoApiError,
  useAssignTaxRateToBillingEntityMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteBillingEntityVatRate on Tax {
    id
    name
    appliedToOrganization
  }

  mutation unassignTaxRateToBillingEntity($input: TaxUpdateInput!) {
    updateTax(input: $input) {
      id
      ...DeleteBillingEntityVatRate
    }
  }
`
export interface DeleteBillingEntityVatRateDialogRef {
  openDialog: (taxRate: DeleteBillingEntityVatRateFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteBillingEntityVatRateDialog = forwardRef<DeleteBillingEntityVatRateDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [taxRate, setTaxRate] = useState<DeleteBillingEntityVatRateFragment>()
    const [unasignTaxRate] = useAssignTaxRateToBillingEntityMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted({ updateTax }) {
        if (updateTax?.id) {
          addToast({
            message: translate('text_64639cfe2e46e9007d11b495'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getBillingEntitySettings'],
    })

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setTaxRate(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_64639cfe2e46e9007d11b45d', {
          name: taxRate?.name,
        })}
        description={<Typography html={translate('text_64639cfe2e46e9007d11b460')} />}
        onContinue={async () =>
          await unasignTaxRate({
            variables: { input: { id: taxRate?.id || '' } },
          })
        }
        continueText={translate('text_64639cfe2e46e9007d11b466')}
      />
    )
  },
)

DeleteBillingEntityVatRateDialog.displayName = 'forwardRef'
