import { forwardRef, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { generatePath, useNavigate } from 'react-router-dom'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { LagoApiError, useCreateWebhookEndpointMutation } from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { WEBHOOK_LOGS_ROUTE } from '~/core/router'

gql`
  mutation createWebhookEndpoint($input: WebhookEndpointCreateInput!) {
    createWebhookEndpoint(input: $input) {
      id
      webhookUrl
    }
  }
`
export interface CreateWebhookDialogRef extends DialogRef {}

export const CreateWebhookDialog = forwardRef<DialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [mutationError, setMutationError] = useState<string | undefined>(undefined)
  const [localWebhook, setLocalWebhook] = useState<string | undefined>(undefined)
  const [createWebhook] = useCreateWebhookEndpointMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_6271200984178801ba8bdec0')}
      description={translate('text_6271200984178801ba8bdee6')}
      onClickAway={() => {
        !!mutationError && setMutationError(undefined)
        setLocalWebhook(undefined)
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              !!mutationError && setMutationError(undefined)
              setLocalWebhook(undefined)
            }}
          >
            {translate('text_6271200984178801ba8bdf4a')}
          </Button>
          <Button
            variant="primary"
            disabled={!localWebhook || !!mutationError}
            onClick={async () => {
              const res = await createWebhook({
                variables: { input: { webhookUrl: localWebhook as string } },
              })
              const { errors } = res

              if (hasDefinedGQLError('UrlIsInvalid', errors)) {
                setMutationError(translate('text_6271200984178801ba8bdf58'))
              } else if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
                setMutationError(translate('text_649453975a0bb300724162f6'))
              } else if (!errors) {
                addToast({
                  message: translate('text_6271200984178801ba8bdf7f'),
                  severity: 'success',
                })

                navigate(
                  generatePath(WEBHOOK_LOGS_ROUTE, {
                    webhookId: res.data?.createWebhookEndpoint?.id,
                  })
                )

                closeDialog()
              }
            }}
          >
            {translate('text_6271200984178801ba8bdf5e')}
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
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

CreateWebhookDialog.displayName = 'forwardRef'
