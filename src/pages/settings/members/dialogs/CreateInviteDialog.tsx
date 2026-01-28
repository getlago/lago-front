import { Stack } from '@mui/material'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useMemo } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import {
  Button,
  Dialog,
  DialogRef,
  GenericPlaceholder,
  Typography,
} from '~/components/designSystem'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { INVITATION_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { zodRequiredEmail } from '~/formValidation/zodCustoms'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { useRoleDisplayInformation } from '~/hooks/useRoleDisplayInformation'
import { useRolesList } from '~/hooks/useRolesList'
import ErrorImage from '~/public/images/maneki/error.svg'

import RolePicker from './RolePicker'

import { CreateInviteSingleRole } from '../common/inviteTypes'
import { useInviteActions } from '../hooks/useInviteActions'

export const SUBMIT_INVITE_DATA_TEST = 'submit-invite-button'
export const FORM_CREATE_INVITE_ID = 'form-create-invite'
export const INVITE_URL_DATA_TEST = 'invitation-url'

export type CreateInviteDialogRef = DialogRef

export const CreateInviteDialog = forwardRef<DialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const { inviteToken, setInviteToken, createInvite, createInviteError } = useInviteActions()
  const { getDisplayName } = useRoleDisplayInformation()
  const { roles } = useRolesList()

  const invitationUrl = `${globalThis.location.origin}${generatePath(INVITATION_ROUTE, {
    token: inviteToken,
  })}`
  const { organization } = useOrganizationInfos()

  const initialValues: CreateInviteSingleRole = {
    email: '',
    role: '',
  }

  const validationSchema = z.object({
    email: zodRequiredEmail,
    role: z.string().min(1, 'text_1768219065391kkeiaebav23'),
  })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await createInvite({
        variables: {
          input: {
            email: value.email.trim(),
            roles: [value.role],
          },
        },
      })

      const { errors } = result

      if (
        hasDefinedGQLError('InviteAlreadyExists', errors) ||
        hasDefinedGQLError('EmailAlreadyUsed', errors)
      ) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              email: {
                message: 'text_63208c701ce25db781407456',
                path: ['email'],
              },
            },
          },
        })
      }
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(FORM_CREATE_INVITE_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const { email, role } = useStore(form.store, (state) => ({
    email: state.values.email,
    role: state.values.role,
  }))

  const roleToDisplay = useMemo(() => {
    return roles.find((r) => r.code === role)
  }, [roles, role])

  const handleClose = () => {
    setInviteToken('')
    form.reset()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const getActions = ({ closeDialog }: { closeDialog: () => void }) => {
    return (
      <>
        <Button variant="quaternary" onClick={closeDialog}>
          {translate('text_63208c711ce25db7814074cd')}
        </Button>
        {inviteToken ? (
          <Button
            disabled={!!createInviteError}
            onClick={() => {
              copyToClipboard(invitationUrl)

              addToast({
                severity: 'info',
                translateKey: 'text_63208c711ce25db781407536',
              })
              closeDialog()
            }}
            data-test="copy-invite-link-button"
          >
            {translate('text_63208c701ce25db7814074a3')}
          </Button>
        ) : (
          <form.AppForm>
            <form.SubmitButton dataTest={SUBMIT_INVITE_DATA_TEST}>
              {translate('text_63208c711ce25db7814074d9')}
            </form.SubmitButton>
          </form.AppForm>
        )}
      </>
    )
  }

  return (
    <Dialog
      ref={ref}
      title={translate('text_63208c701ce25db78140748f')}
      description={
        inviteToken
          ? translate('text_63208c701ce25db78140743a', {
              organizationName: organization?.name,
            })
          : translate('text_63208c701ce25db78140749b')
      }
      onClose={handleClose}
      actions={getActions}
      formId={FORM_CREATE_INVITE_ID}
      formSubmit={handleSubmit}
    >
      <div className="mb-8 flex flex-col gap-6">
        {!inviteToken && (
          <Stack gap={8}>
            <form.AppField name="email">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['lowercase']}
                  label={translate('text_63208c701ce25db7814074ab')}
                  placeholder={translate('text_63208c711ce25db7814074c1')}
                />
              )}
            </form.AppField>
            <RolePicker form={form} fields={{ role: 'role' }} />
          </Stack>
        )}
        {inviteToken && !!createInviteError && (
          <GenericPlaceholder
            noMargins
            subtitle={translate('text_63208c701ce25db781407485')}
            image={<ErrorImage width="136" height="104" />}
          />
        )}
        {inviteToken && !createInviteError && (
          <>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407458')}
              </Typography>
              <Typography variant="body" color="grey700" noWrap>
                {email}
              </Typography>
            </div>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_664f035a68227f00e261b7ec')}
              </Typography>
              {roleToDisplay && (
                <Typography variant="body" color="grey700" noWrap>
                  {getDisplayName(roleToDisplay)}
                </Typography>
              )}
            </div>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407475')}
              </Typography>
              <Typography
                className="line-break-anywhere"
                variant="body"
                color="grey700"
                data-test={INVITE_URL_DATA_TEST}
              >
                {invitationUrl}
              </Typography>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
})

CreateInviteDialog.displayName = 'CreateInviteDialog'
