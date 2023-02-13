import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography, DialogRef } from '~/components/designSystem'
import { useRevokeMembershipMutation } from '~/generated/graphql'
import { WarningDialog } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

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

export const RevokeMembershipDialog = forwardRef<RevokeMembershipDialogRef>((_, ref) => {
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

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_63208bfc99e69a28211ec794')}
      description={
        <Typography>
          {translate('text_63208bfc99e69a28211ec7a6', {
            memberEmail: membershipInfos?.email,
            organizationName: membershipInfos?.organizationName,
          })}
        </Typography>
      }
      onContinue={async () =>
        await revokeMembership({
          variables: { input: { id: membershipInfos?.id as string } },
        })
      }
      continueText={translate('text_63208bfc99e69a28211ec7b4')}
    />
  )
})

RevokeMembershipDialog.displayName = 'RevokeMembershipDialog'
