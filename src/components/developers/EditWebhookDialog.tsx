import { forwardRef, useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateOrganizationMutation, LagoApiError } from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'

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
    const navigate = useNavigate()
    const [mutationError, setMutationError] = useState<string | undefined>(undefined)
    const [localWebhook, setLocalWebhook] = useState<string | undefined>(webhook || undefined)
    const isEdition = !!webhook
    const [updateWebhook] = useUpdateOrganizationMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
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

                if (hasDefinedGQLError('UrlIsInvalid', errors)) {
                  setMutationError(translate('text_6271200984178801ba8bdf58'))
                } else if (!errors) {
                  addToast({
                    message: translate(
                      isEdition ? 'text_6271200984178801ba8bdf98' : 'text_6271200984178801ba8bdf7f'
                    ),
                    severity: 'success',
                  })

                  !isEdition && navigate(WEBHOOK_LOGS_ROUTE)

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
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
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
