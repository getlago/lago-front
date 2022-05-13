import { forwardRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import {
  useUpdateCustomerVatRateMutation,
  Lago_Api_Error,
  EditCustomerVatRateFragment,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { LagoGQLError, addToast } from '~/core/apolloClient'

gql`
  mutation updateCustomerVatRate($input: UpdateCustomerVatRateInput!) {
    updateCustomerVatRate(input: $input) {
      id
      vatRate
    }
  }

  fragment EditCustomerVatRate on CustomerDetails {
    id
    name
    vatRate
  }
`
export interface EditCustomerVatRateDialogRef extends DialogRef {}

interface EditCustomerVatRateDialogProps {
  customer: EditCustomerVatRateFragment
  vatRate?: number | null | undefined
}

export const EditCustomerVatRateDialog = forwardRef<DialogRef, EditCustomerVatRateDialogProps>(
  ({ customer }: EditCustomerVatRateDialogProps, ref) => {
    const { translate } = useI18nContext()
    const [mutationError, setMutationError] = useState<string | undefined>(undefined)
    const vatRate = typeof customer?.vatRate === 'number' ? customer?.vatRate : undefined
    const [localVatRate, setLocalVatRate] = useState<number | undefined>(vatRate)
    const isEdition = typeof vatRate === 'number'
    const [updateVatRate] = useUpdateCustomerVatRateMutation({
      context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
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
                const error = !errors
                  ? undefined
                  : (errors[0]?.extensions as LagoGQLError['extensions'])

                if (
                  !!error &&
                  error?.code === Lago_Api_Error.UnprocessableEntity &&
                  !!error?.details?.vatRate
                ) {
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
        <Content>
          <TextInput
            label={translate('text_627387d5053a1000c5287ca5')}
            placeholder={translate('text_627387d5053a1000c5287ca5')}
            value={localVatRate}
            beforeChangeFormatter="positiveNumber"
            error={mutationError}
            onChange={(value) => {
              !!mutationError && setMutationError(undefined)
              setLocalVatRate(value === '' ? undefined : Number(value))
            }}
            InputProps={{
              endAdornment: (
                <InputEnd color="textSecondary">
                  {translate('text_62728ff857d47b013204c7ce')}
                </InputEnd>
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

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`

EditCustomerVatRateDialog.displayName = 'forwardRef'
