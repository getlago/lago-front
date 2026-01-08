import { Stack } from '@mui/material'
import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { z } from 'zod'

import { Avatar, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { InviteForEditRoleForDialogFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import RolePicker from './RolePicker'

import { UpdateInviteSingleRole } from '../common/inviteTypes'
import { useInviteActions } from '../hooks/useInviteActions'

export const EDIT_INVITE_ROLE_FORM_ID = 'form-edit-invite-role'
export interface EditInviteRoleDialogRef {
  openDialog: (localData: InviteForEditRoleForDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type InviteForEditRoleForDialogImperativeProps = {
  invite: InviteForEditRoleForDialogFragment | null
}

export const EditInviteRoleDialog = forwardRef<EditInviteRoleDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const { updateInviteRole } = useInviteActions()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<InviteForEditRoleForDialogImperativeProps | null>(null)

  const validationSchema = z.object({
    role: z.string(),
  })

  const initialValues: UpdateInviteSingleRole = {
    role: localData?.invite?.roles[0] || 'Admin',
  }

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateInviteRole({
        variables: {
          input: {
            roles: [value.role],
            id: localData?.invite?.id as string,
          },
        },
      })

      setLocalData(null)
      dialogRef.current?.closeDialog()
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  const handleClose = () => {
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
          {translate('text_62bb10ad2a10bd182d002031')}
        </Button>
        <form.AppForm>
          <form.SubmitButton>{translate('text_664f035a68227f00e261b7f6')}</form.SubmitButton>
        </form.AppForm>
      </>
    )
  }

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_664f035a68227f00e261b7e9')}
      onClose={handleClose}
      actions={getActions}
      formId={EDIT_INVITE_ROLE_FORM_ID}
      formSubmit={handleSubmit}
    >
      <div className="mb-8 flex flex-col gap-8">
        <Stack gap={3} direction="row" alignItems="center">
          <Avatar
            variant="user"
            identifier={(localData?.invite?.email || '').charAt(0)}
            size="big"
          />
          <Typography variant="body" color="grey700">
            {localData?.invite?.email}
          </Typography>
        </Stack>

        <RolePicker form={form} fields={{ role: 'role' }} />
      </div>
    </Dialog>
  )
})

EditInviteRoleDialog.displayName = 'forwardRef'
