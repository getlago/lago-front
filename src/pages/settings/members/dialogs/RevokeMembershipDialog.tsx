import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, WarningDialog } from '~/components/designSystem'
import { MembershipItemForMembershipSettingsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useMembershipActions } from '../hooks/useMembershipActions'

export interface RevokeMembershipDialogRef {
  openDialog: (membershipInfos: { id: string; email: string; organizationName: string }) => unknown
  closeDialog: () => unknown
}

export const RevokeMembershipDialog = forwardRef<
  RevokeMembershipDialogRef,
  { admins: MembershipItemForMembershipSettingsFragment[] }
>(({ admins }, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const { revokeMembership } = useMembershipActions()

  const [membershipInfos, setMembershipInfos] = useState<
    { id: string; email: string; organizationName: string } | undefined
  >()

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setMembershipInfos(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  const isDeletingLastAdmin =
    !!admins.find((admin) => admin.id === membershipInfos?.id) && admins.length === 1

  return (
    <WarningDialog
      ref={dialogRef}
      mode={isDeletingLastAdmin ? 'info' : 'danger'}
      title={
        isDeletingLastAdmin
          ? translate('text_664f0385f68b4b012708f6cd')
          : translate('text_63208bfc99e69a28211ec794')
      }
      description={
        isDeletingLastAdmin
          ? translate('text_664f0385f68b4b012708f6ce')
          : translate('text_63208bfc99e69a28211ec7a6', {
              memberEmail: membershipInfos?.email,
              organizationName: membershipInfos?.organizationName,
            })
      }
      onContinue={async () => {
        if (isDeletingLastAdmin) {
          dialogRef.current?.closeDialog()
        } else {
          await revokeMembership({
            variables: { input: { id: membershipInfos?.id as string } },
          })
        }
      }}
      continueText={
        isDeletingLastAdmin
          ? translate('text_664f0385f68b4b012708f6cf')
          : translate('text_63208bfc99e69a28211ec7b4')
      }
    />
  )
})

RevokeMembershipDialog.displayName = 'RevokeMembershipDialog'
