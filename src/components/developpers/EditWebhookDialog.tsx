import { forwardRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateOrganizationMutation, Lago_Api_Error } from '~/generated/graphql'
import { theme } from '~/styles'
import { LagoGQLError, addToast } from '~/core/apolloClient'

gql`
  mutation updateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      webhookUrl
    }
  }
`
export interface EditWebhookDialogRef extends DialogRef {}

interface EditWebhookDialogProps {
  webhook?: string | null
}

export const EditWebhookDialog = forwardRef<DialogRef, EditWebhookDialogProps>(
  ({ webhook }: EditWebhookDialogProps, ref) => {
    const { translate } = useInternationalization()
    const [mutationError, setMutationError] = useState<string | undefined>(undefined)
    const [localWebhook, setLocalWebhook] = useState<string | undefined>(webhook || undefined)
    const isEdition = !!webhook
    const [updateWebhook] = useUpdateOrganizationMutation({
      context: { silentErrorCodes: [Lago_Api_Error.UnprocessableEntity] },
    })

    useEffect(() => {
      setLocalWebhook(webhook || undefined)
    }, [webhook])

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_6271200984178801ba8bdeba' : 'text_6271200984178801ba8bdec0'
        )}
        description={translate(
          isEdition ? 'text_6271200984178801ba8bdec6' : 'text_6271200984178801ba8bdee6'
        )}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setLocalWebhook(webhook || undefined)
              }}
            >
              {translate('text_6271200984178801ba8bdf4a')}
            </Button>
            <Button
              variant="primary"
              disabled={!localWebhook || localWebhook === webhook || !!mutationError}
              onClick={async () => {
                const res = await updateWebhook({
                  variables: { input: { webhookUrl: localWebhook } },
                })
                const { errors } = res
                const error = !errors
                  ? undefined
                  : (errors[0]?.extensions as LagoGQLError['extensions'])

                if (
                  !!error &&
                  error?.code === Lago_Api_Error.UnprocessableEntity &&
                  !!error?.details?.webhookUrl
                ) {
                  setMutationError(translate('text_6271200984178801ba8bdf58'))
                } else if (!errors) {
                  addToast({
                    message: translate(
                      isEdition ? 'text_6271200984178801ba8bdf98' : 'text_6271200984178801ba8bdf7f'
                    ),
                    severity: 'success',
                  })
                  closeDialog()
                }
              }}
            >
              {translate(
                isEdition ? 'text_6271200984178801ba8bdf3e' : 'text_6271200984178801ba8bdf5e'
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInput
            label={translate('text_6271200984178801ba8bdf22')}
            placeholder={translate('text_6271200984178801ba8bdf36')}
            value={localWebhook}
            error={mutationError}
            onChange={(value) => {
              !!mutationError && setMutationError(undefined)
              setLocalWebhook(value)
            }}
            helperText={
              <Typography
                variant="caption"
                color="inherit"
                html={translate('text_62ce85fb3fb6842020331d83')}
              />
            }
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditWebhookDialog.displayName = 'forwardRef'
