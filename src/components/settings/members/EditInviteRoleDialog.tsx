import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { Avatar } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import {
  InviteForEditRoleForDialogFragment,
  MembershipRole,
  UpdateInviteInput,
  useUpdateInviteRoleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RolePickerField } from './RolePickerField'

gql`
  fragment InviteForEditRoleForDialog on Invite {
    id
    role
    email
  }

  mutation updateInviteRole($input: UpdateInviteInput!) {
    updateInvite(input: $input) {
      id
      ...InviteForEditRoleForDialog
    }
  }
`

export interface EditInviteRoleDialogRef {
  openDialog: (localData: InviteForEditRoleForDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type InviteForEditRoleForDialogImperativeProps = {
  invite: InviteForEditRoleForDialogFragment | null
}

export const EditInviteRoleDialog = forwardRef<EditInviteRoleDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<InviteForEditRoleForDialogImperativeProps | null>(null)
  const [updateInviteRole] = useUpdateInviteRoleMutation({
    onCompleted(res) {
      if (res?.updateInvite) {
        addToast({
          severity: 'success',
          translateKey: 'text_664f3562b7caf600e5246883',
        })
      }
    },
  })

  const formikProps = useFormik<Pick<UpdateInviteInput, 'role'>>({
    initialValues: {
      role: localData?.invite?.role || MembershipRole.Admin,
    },
    validationSchema: object().shape({
      role: string().required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateInviteRole({
        variables: {
          input: {
            ...values,
            id: localData?.invite?.id as string,
          },
        },
      })
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

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_664f035a68227f00e261b7e9')}
      onClose={() => {
        formikProps.resetForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62bb10ad2a10bd182d002031')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
              formikProps.resetForm()
              setLocalData(null)
            }}
          >
            {translate('text_664f035a68227f00e261b7f6')}
          </Button>
        </>
      )}
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

        <RolePickerField
          title={translate('text_664f035a68227f00e261b7ec')}
          onChange={(value) => formikProps.setFieldValue('role', value)}
          selectedValue={formikProps.values.role}
        />
      </div>
    </Dialog>
  )
})

EditInviteRoleDialog.displayName = 'forwardRef'
