import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography, WarningDialog } from '~/components/designSystem'
import { RoleItem } from '~/core/constants/roles'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useRoleActions } from '../../hooks/useRoleActions'

export interface DeleteRoleDialogRef {
  openDialog: (role: RoleItem) => unknown
  closeDialog: () => unknown
}

export const DeleteRoleDialog = forwardRef<DeleteRoleDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const { deleteRole } = useRoleActions()

  const [role, setRole] = useState<RoleItem | undefined>()

  useImperativeHandle(ref, () => ({
    openDialog: (roleInfo) => {
      setRole(roleInfo)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  const handleDeleteRole = async () => {
    if (!role) return

    await deleteRole({
      id: role?.id,
    })
  }

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_17677905696331arrjnqzwwb')}
      description={
        <Typography>
          {translate('text_1767790569633bso609s2bau', {
            roleName: role?.name,
          })}
        </Typography>
      }
      onContinue={handleDeleteRole}
      continueText={translate('text_176779056963310shb5ayw55')}
    />
  )
})

DeleteRoleDialog.displayName = 'DeleteRoleDialog'
