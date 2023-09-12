import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  DeleteOrganizationVatRateFragment,
  LagoApiError,
  useAssignTaxRateToOrganizationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { WarningDialog } from '../WarningDialog'

gql`
  fragment DeleteOrganizationVatRate on Tax {
    id
    name
    appliedToOrganization
  }

  mutation unassignTaxRateToOrganization($input: TaxUpdateInput!) {
    updateTax(input: $input) {
      id
      ...DeleteOrganizationVatRate
    }
  }
`
export interface DeleteOrganizationVatRateDialogRef {
  openDialog: (taxRate: DeleteOrganizationVatRateFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteOrganizationVatRateDialog = forwardRef<DeleteOrganizationVatRateDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [taxRate, setTaxRate] = useState<DeleteOrganizationVatRateFragment>()
    const [unasignTaxRate] = useAssignTaxRateToOrganizationMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted({ updateTax }) {
        if (updateTax?.id) {
          addToast({
            message: translate('text_64639cfe2e46e9007d11b495'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getOrganizationSettings'],
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
            variables: { input: { id: taxRate?.id || '', appliedToOrganization: false } },
          })
        }
        continueText={translate('text_64639cfe2e46e9007d11b466')}
      />
    )
  }
)

DeleteOrganizationVatRateDialog.displayName = 'forwardRef'
