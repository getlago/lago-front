import { forwardRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateVatRateOrganizationMutation, LagoApiError } from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'

gql`
  mutation updateVatRateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      billingConfiguration {
        id
        vatRate
      }
    }
  }
`
export interface EditOrganizationVatRateDialogRef extends DialogRef {}

interface EditOrganizationVatRateDialogProps {
  vatRate: number
}

export const EditOrganizationVatRateDialog = forwardRef<
  DialogRef,
  EditOrganizationVatRateDialogProps
>(({ vatRate }: EditOrganizationVatRateDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [mutationError, setMutationError] = useState<string | undefined>(undefined)
  const [localVatRate, setLocalVatRate] = useState<number>(vatRate)
  const [updateVatRate] = useUpdateVatRateOrganizationMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  useEffect(() => {
    setLocalVatRate(vatRate)
  }, [vatRate])

  return (
    <Dialog
      ref={ref}
      title={translate('text_62728ff857d47b013204c76c')}
      description={translate('text_62728ff857d47b013204c77a')}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              setLocalVatRate(vatRate)
            }}
          >
            {translate('text_62728ff857d47b013204c7e4')}
          </Button>
          <Button
            variant="primary"
            disabled={
              typeof localVatRate !== 'number' || localVatRate === vatRate || !!mutationError
            }
            onClick={async () => {
              const res = await updateVatRate({
                variables: { input: { billingConfiguration: { vatRate: localVatRate } } },
              })
              const { errors } = res

              if (hasDefinedGQLError('ValueIsOutOfRange', errors)) {
                setMutationError(translate('text_6272a16eea94bd01089abaa7'))
              } else if (!errors) {
                addToast({
                  message: translate('text_62728ff857d47b013204c86f'),
                  severity: 'success',
                })
                closeDialog()
              }
            }}
          >
            {translate('text_62728ff857d47b013204c7fa')}
          </Button>
        </>
      )}
    >
      <Content>
        <TextInput
          label={translate('text_62728ff857d47b013204c7a2')}
          value={localVatRate}
          error={mutationError}
          beforeChangeFormatter="positiveNumber"
          onChange={(value) => {
            !!mutationError && setMutationError(undefined)
            setLocalVatRate(Number(value))
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
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditOrganizationVatRateDialog.displayName = 'forwardRef'
