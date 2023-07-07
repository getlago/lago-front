import { forwardRef, useState, useRef, useImperativeHandle } from 'react'
import { gql } from '@apollo/client'

import { DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CustomerAppliedTaxRatesForSettingsFragmentDoc,
  TaxForDeleteCustomerTaxDialogFragment,
  useRemoveAppliedTaxRateOnCustomerMutation,
} from '~/generated/graphql'
import { addToast } from '~/core/apolloClient'

import { WarningDialog } from '../WarningDialog'

gql`
  fragment TaxForDeleteCustomerTaxDialog on Tax {
    id
    name
  }

  mutation removeAppliedTaxRateOnCustomer($input: DestroyCustomerAppliedTaxInput!) {
    destroyCustomerAppliedTax(input: $input) {
      id
      customer {
        id
      }
    }
  }

  ${CustomerAppliedTaxRatesForSettingsFragmentDoc}
`

export interface DeleteCustomerTaxDialogRef {
  openDialog: (appliedTaxRateId: string, taxRate: TaxForDeleteCustomerTaxDialogFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteCustomerTaxDialog = forwardRef<DeleteCustomerTaxDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [appliedTaxRateId, setAppliedTaxRateId] = useState<string>('')
  const [taxRate, setTaxRate] = useState<TaxForDeleteCustomerTaxDialogFragment>()
  const [removeAppliedTaxRateOnCustomer] = useRemoveAppliedTaxRateOnCustomerMutation({
    onCompleted({ destroyCustomerAppliedTax }) {
      if (destroyCustomerAppliedTax?.id) {
        addToast({
          message: translate('text_64639f5e63a5cc0076779dd9'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getCustomerSettings'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (localId, data) => {
      setAppliedTaxRateId(localId)
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
      title={translate('text_64639f5e63a5cc0076779d37', {
        name: taxRate?.name,
      })}
      description={translate('text_64639f5e63a5cc0076779d3b')}
      onContinue={async () =>
        await removeAppliedTaxRateOnCustomer({
          variables: { input: { id: appliedTaxRateId as string } },
        })
      }
      continueText={translate('text_64639f5e63a5cc0076779d43')}
    />
  )
})

DeleteCustomerTaxDialog.displayName = 'forwardRef'
