import { gql } from '@apollo/client'
import { forwardRef, useState } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { STRIPE_INTEGRATION_ROUTE } from '~/core/router'
import { StripeIntegrationFragmentDoc, useAddStripeApiKeyMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation addStripeApiKey($input: AddStripePaymentProviderInput!) {
    addStripePaymentProvider(input: $input) {
      id
      ...StripeIntegration
    }
  }

  ${StripeIntegrationFragmentDoc}
`

export interface AddStripeDialogRef extends DialogRef {}

interface AddStripDialog {
  isEdition?: boolean
}

export const AddStripeDialog = forwardRef<AddStripeDialogRef, AddStripDialog>(
  ({ isEdition }: AddStripDialog, ref) => {
    const { translate } = useInternationalization()
    const [stripeApiKey, setStripeApiKey] = useState<string>('')
    const navigate = useNavigate()
    const [addApiKey] = useAddStripeApiKeyMutation({
      onCompleted({ addStripePaymentProvider }) {
        if (addStripePaymentProvider?.id) {
          if (!isEdition) {
            navigate(STRIPE_INTEGRATION_ROUTE)
          }
          setStripeApiKey('')
          addToast({
            message: translate(
              isEdition ? 'text_62b1edddbf5f461ab97126f6' : 'text_62b1edddbf5f461ab9712743'
            ),
            severity: 'success',
          })
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_62b1edddbf5f461ab971272d' : 'text_62b1edddbf5f461ab971272b'
        )}
        description={translate(
          isEdition ? 'text_62b1edddbf5f461ab9712737' : 'text_62b1edddbf5f461ab9712739'
        )}
        onClose={() => {
          setStripeApiKey('')
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!stripeApiKey}
              onClick={async () => {
                await addApiKey({
                  variables: {
                    input: {
                      secretKey: stripeApiKey,
                      createCustomers: false,
                    },
                  },
                })

                if (isEdition) {
                  closeDialog()
                }
              }}
            >
              {translate(
                isEdition ? 'text_62b1edddbf5f461ab9712769' : 'text_62b1edddbf5f461ab9712773'
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInput
            label={translate('text_62b1edddbf5f461ab9712748')}
            placeholder={translate(
              isEdition ? 'text_62b1edddbf5f461ab9712754' : 'text_62b1edddbf5f461ab9712756'
            )}
            value={stripeApiKey}
            onChange={setStripeApiKey}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

AddStripeDialog.displayName = 'AddStripeDialog'
