import { forwardRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  useUpdateCustomerVatRateMutation,
  LagoApiError,
  EditCustomerVatRateFragment,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'

gql`
  fragment EditCustomerVatRate on Customer {
    id
    name
    vatRate
  }

  mutation updateCustomerVatRate($input: UpdateCustomerVatRateInput!) {
    updateCustomerVatRate(input: $input) {
      id
      ...EditCustomerVatRate
    }
  }
`
export interface EditCustomerVatRateDialogRef extends DialogRef {}

interface EditCustomerVatRateDialogProps {
  customer: EditCustomerVatRateFragment
}

export const EditCustomerVatRateDialog = forwardRef<DialogRef, EditCustomerVatRateDialogProps>(
  ({ customer }: EditCustomerVatRateDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [mutationError, setMutationError] = useState<string | undefined>(undefined)
    const vatRate = typeof customer?.vatRate === 'number' ? customer?.vatRate : undefined
    const [localVatRate, setLocalVatRate] = useState<number | undefined>(vatRate)
    const isEdition = typeof vatRate === 'number'
    const [updateVatRate] = useUpdateCustomerVatRateMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    })

    useEffect(() => {
      setLocalVatRate(vatRate)
    }, [vatRate])

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_62728ff857d47b013204c748' : 'text_627387d5053a1000c5287ca1'
        )}
        description={
          isEdition
            ? translate('text_62728ff857d47b013204c770', { customeFullName: customer.name })
            : translate('text_627387d5053a1000c5287ca3')
        }
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setLocalVatRate(vatRate)
              }}
            >
              {translate('text_627387d5053a1000c5287cab')}
            </Button>
            <Button
              variant="primary"
              disabled={
                typeof localVatRate !== 'number' || localVatRate === vatRate || !!mutationError
              }
              onClick={async () => {
                const res = await updateVatRate({
                  variables: {
                    input: {
                      id: customer.id,
                      vatRate: localVatRate as number,
                    },
                  },
                })
                const { errors } = res

                if (hasDefinedGQLError('ValueIsOutOfRange', errors)) {
                  setMutationError(translate('text_6272a16eea94bd01089abaa7'))
                } else if (!errors) {
                  addToast({
                    message: translate(
                      isEdition ? 'text_62728ff857d47b013204cc4f' : 'text_62728ff857d47b013204cc62'
                    ),
                    severity: 'success',
                  })
                  closeDialog()
                }
              }}
            >
              {translate(
                isEdition ? 'text_62728ff857d47b013204c7f2' : 'text_627387d5053a1000c5287cad'
              )}
            </Button>
          </>
        )}
      >
        <Content data-test="edit-customer-vat-rate-dialog">
          <TextInput
            label={translate('text_627387d5053a1000c5287ca5')}
            placeholder={translate('text_627387d5053a1000c5287ca7')}
            value={localVatRate}
            beforeChangeFormatter="positiveNumber"
            error={mutationError}
            onChange={(value) => {
              !!mutationError && setMutationError(undefined)
              setLocalVatRate(value === '' ? undefined : Number(value))
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_62728ff857d47b013204c7ce')}
                </InputAdornment>
              ),
            }}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditCustomerVatRateDialog.displayName = 'forwardRef'
