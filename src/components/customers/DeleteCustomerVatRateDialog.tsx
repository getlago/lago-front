import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  CustomerAppliedTaxRatesForSettingsFragmentDoc,
  EditCustomerVatRateFragment,
  TaxRateForDeleteCustomerVatRateDialogFragment,
  useRemoveAppliedTaxRateOnCustomerMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomerForDeleteVatRateDialog on Customer {
    id
    name
    externalId
    taxes {
      id
      code
    }
  }

  fragment TaxRateForDeleteCustomerVatRateDialog on Tax {
    id
    name
  }

  mutation removeAppliedTaxRateOnCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
    }
  }

  ${CustomerAppliedTaxRatesForSettingsFragmentDoc}
`

interface DeleteCustomerVatRateDialogProps {
  customer: EditCustomerVatRateFragment
}

export interface DeleteCustomerVatRateDialogRef {
  openDialog: (taxRate: TaxRateForDeleteCustomerVatRateDialogFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteCustomerVatRateDialog = forwardRef<
  DeleteCustomerVatRateDialogRef,
  DeleteCustomerVatRateDialogProps
>(({ customer }: DeleteCustomerVatRateDialogProps, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [taxRate, setTaxRate] = useState<TaxRateForDeleteCustomerVatRateDialogFragment>()
  const [removeAppliedTaxRateOnCustomer] = useRemoveAppliedTaxRateOnCustomerMutation({
    onCompleted({ updateCustomer }) {
      if (updateCustomer?.id) {
        addToast({
          message: translate('text_64639f5e63a5cc0076779dd9'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getCustomerSettings'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (taxRateData) => {
      setTaxRate(taxRateData)
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
          variables: {
            input: {
              id: customer?.id as string,
              taxCodes:
                customer?.taxes?.filter((tax) => tax.id !== taxRate?.id).map((tax) => tax.code) ||
                [],
              // NOTE: API should not require those fields on customer update
              // To be tackled as improvement
              externalId: customer?.externalId || '',
              name: customer?.name || '',
            },
          },
        })
      }
      continueText={translate('text_64639f5e63a5cc0076779d43')}
    />
  )
})

DeleteCustomerVatRateDialog.displayName = 'forwardRef'
