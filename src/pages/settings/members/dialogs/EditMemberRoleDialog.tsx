import { Stack } from '@mui/material'
import { revalidateLogic } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, Avatar, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { HOME_ROUTE } from '~/core/router'
import { MemberForEditRoleForDialogFragment, PermissionEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useRolesList } from '~/hooks/useRolesList'

import RolePicker from './RolePicker'

import { UpdateInviteSingleRole } from '../common/inviteTypes'
import { useMembershipActions } from '../hooks/useMembershipActions'

export interface EditMemberRoleDialogRef {
  openDialog: (localData: MemberForEditRoleForDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type MemberForEditRoleForDialogImperativeProps = {
  member: MemberForEditRoleForDialogFragment | null
  isEditingLastAdmin: boolean
  isEditingMyOwnMembership: boolean
}

export const EDIT_MEMBER_ROLE_FORM_ID = 'form-edit-member-role'

export const EditMemberRoleDialog = forwardRef<EditMemberRoleDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { updateMembershipRole } = useMembershipActions()
  const { roles, isLoadingRoles } = useRolesList()

  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<MemberForEditRoleForDialogImperativeProps | null>(null)

  const validationSchema = z.object({
    role: z.string(),
  })

  const initialRole = roles.find((role) => role.name === localData?.member?.roles[0])

  const initialValues: UpdateInviteSingleRole = {
    role: initialRole?.code || 'admin',
  }

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await updateMembershipRole({
        variables: {
          input: {
            roles: [value.role],
            id: localData?.member?.id as string,
          },
        },
      })

      dialogRef.current?.closeDialog()

      const newRole = roles.find((role) => role.name === res.data?.updateMembership?.roles[0])

      // If you edit your own memberships role to something else that do not have the right permission,
      // you will get redirected to home page
      if (
        localData?.isEditingMyOwnMembership &&
        !newRole?.permissions.includes(PermissionEnum.RolesView)
      ) {
        // The redirection have to be retriggered on the next tick to avoid wrong forbidden page display
        setTimeout(() => {
          navigate(HOME_ROUTE)
        }, 1)
      }
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
      formId={EDIT_MEMBER_ROLE_FORM_ID}
      formSubmit={handleSubmit}
    >
      {!isLoadingRoles && (
        <div className="mb-8 flex flex-col gap-8">
          <Stack gap={3} direction="row" alignItems="center">
            <Avatar
              variant="user"
              identifier={(localData?.member?.user?.email || '').charAt(0)}
              size="big"
            />
            <Typography variant="body" color="grey700">
              {localData?.member?.user?.email}
            </Typography>
          </Stack>

          <RolePicker form={form} fields={{ role: 'role' }} />

          {localData?.isEditingLastAdmin && (
            <Alert type="danger">{translate('text_664f035a68227f00e261b7f4')}</Alert>
          )}
        </div>
      )}
    </Dialog>
  )
})

EditMemberRoleDialog.displayName = 'forwardRef'
