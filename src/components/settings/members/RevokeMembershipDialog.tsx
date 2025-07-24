import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  MembershipItemForMembershipSettingsFragment,
  useRevokeMembershipMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation revokeMembership($input: RevokeMembershipInput!) {
    revokeMembership(input: $input) {
      id
    }
  }
`

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
  const [revokeMembership] = useRevokeMembershipMutation({
    onCompleted(data) {
      if (data && data.revokeMembership) {
        addToast({
          message: translate('text_63208c711ce25db78140755d'),
          severity: 'success',
        })
      }
    },

    update(cache, { data }) {
      if (!data?.revokeMembership) return

      const cacheId = cache.identify({
        id: data?.revokeMembership.id,
        __typename: 'Membership',
      })

      cache.evict({ id: cacheId })
    },
  })

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
