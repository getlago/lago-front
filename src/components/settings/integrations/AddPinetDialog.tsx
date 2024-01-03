import { gql } from '@apollo/client'
import { forwardRef, useState } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { PINET_INTEGRATION_ROUTE } from '~/core/router'
import { PinetIntegrationFragmentDoc, useAddPinetApiKeyMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation addPinetApiKey($input: AddPinetPaymentProviderInput!) {
    addPinetPaymentProvider(input: $input) {
      id
      ...PinetIntegration
    }
  }

  ${PinetIntegrationFragmentDoc}
`

export interface AddPinetDialogRef extends DialogRef {}

interface AddPinetDialog {
  isEdition?: boolean
}

export const AddPinetDialog = forwardRef<AddPinetDialogRef, AddPinetDialog>(
  ({ isEdition }: AddPinetDialog, ref) => {
    const { translate } = useInternationalization()
    const [pinetApiKey, setPinetApiKey] = useState<string>('')
    const navigate = useNavigate()
    const [addApiKey] = useAddPinetApiKeyMutation({
      onCompleted({ addPinetPaymentProvider }) {
        if (addPinetPaymentProvider?.id) {
          if (!isEdition) {
            navigate(PINET_INTEGRATION_ROUTE)
          }
          setPinetApiKey('')
          addToast({
            message: translate(
              isEdition
                ? 'Pinet API secret key successfully edited'
                : 'Pinet API secret key successfully added',
            ),
            severity: 'success',
          })
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate(isEdition ? 'Edit Pinet API secret key' : 'Connect to PINET')}
        description={translate(
          isEdition
            ? 'By editing the API secret key, upcoming data will not be synchronised to the connected PINET account.'
            : 'To connect to PINET, please enter the API key generated from your PINET account.',
        )}
        onClose={() => {
          setPinetApiKey('')
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!pinetApiKey}
              onClick={async () => {
                await addApiKey({
                  variables: {
                    input: {
                      secretKey: pinetApiKey,
                      createCustomers: false,
                    },
                  },
                })

                if (isEdition) {
                  closeDialog()
                }
              }}
            >
              {translate(isEdition ? 'text_62b1edddbf5f461ab9712769' : 'Connect to PINET')}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInput
            label={translate('text_62b1edddbf5f461ab9712748')}
            placeholder={translate(
              isEdition ? 'text_62b1edddbf5f461ab9712754' : 'text_62b1edddbf5f461ab9712756',
            )}
            value={pinetApiKey}
            onChange={setPinetApiKey}
          />
        </Content>
      </Dialog>
    )
  },
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

AddPinetDialog.displayName = 'AddPinetDialog'
