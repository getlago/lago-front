import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { Avatar } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { object, string } from 'yup'

import { Alert, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import {
  MemberForEditRoleForDialogFragment,
  MembershipPermissionsFragmentDoc,
  MembershipRole,
  UpdateMembershipInput,
  useUpdateMembershipRoleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RolePickerField } from './RolePickerField'

gql`
  fragment MemberForEditRoleForDialog on Membership {
    id
    role
    user {
      id
      email
    }
    ...MembershipPermissions
  }

  mutation updateMembershipRole($input: UpdateMembershipInput!) {
    updateMembership(input: $input) {
      id
      ...MemberForEditRoleForDialog
    }
  }

  ${MembershipPermissionsFragmentDoc}
`

export interface EditMemberRoleDialogRef {
  openDialog: (localData: MemberForEditRoleForDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type MemberForEditRoleForDialogImperativeProps = {
  member: MemberForEditRoleForDialogFragment | null
  isEditingLastAdmin: boolean
  isEditingMyOwnMembership: boolean
}

export const EditMemberRoleDialog = forwardRef<EditMemberRoleDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<MemberForEditRoleForDialogImperativeProps | null>(null)

  const [updateMembershipRole] = useUpdateMembershipRoleMutation({
    onCompleted(res) {
      if (res?.updateMembership) {
        addToast({
          severity: 'success',
          translateKey: 'text_664f3562b7caf600e5246883',
        })
      }
    },
    refetchQueries: ['getMembers'],
  })

  const formikProps = useFormik<Pick<UpdateMembershipInput, 'role'>>({
    initialValues: {
      role: localData?.member?.role || MembershipRole.Admin,
    },
    validationSchema: object().shape({
      role: string().required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const res = await updateMembershipRole({
        variables: {
          input: {
            ...values,
            id: localData?.member?.id as string,
          },
        },
      })

      // If you edit your own memberships role to something else than admin, you will get redirected to home page
      if (
        localData?.isEditingMyOwnMembership &&
        res.data?.updateMembership?.role !== MembershipRole.Admin
      ) {
        // The redirection have to be reiggered on the next tick to avoid wrong forbidden page display
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
            disabled={!formikProps.isValid || !formikProps.dirty || localData?.isEditingLastAdmin}
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
            identifier={(localData?.member?.user?.email || '').charAt(0)}
            size="big"
          />
          <Typography variant="body" color="grey700">
            {localData?.member?.user?.email}
          </Typography>
        </Stack>

        <RolePickerField
          title={translate('text_664f035a68227f00e261b7ec')}
          onChange={(value) => formikProps.setFieldValue('role', value)}
          selectedValue={formikProps.values.role}
        />

        {localData?.isEditingLastAdmin && (
          <Alert type="danger">{translate('text_664f035a68227f00e261b7f4')}</Alert>
        )}
      </div>
    </Dialog>
  )
})

EditMemberRoleDialog.displayName = 'forwardRef'
