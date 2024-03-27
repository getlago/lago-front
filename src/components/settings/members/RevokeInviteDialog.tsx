import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef, Typography } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { useRevokeInviteMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation revokeInvite($input: RevokeInviteInput!) {
    revokeInvite(input: $input) {
      id
    }
  }
`

export interface RevokeInviteDialogRef {
  openDialog: (inviteInfos: { id: string; email: string; organizationName: string }) => unknown
  closeDialog: () => unknown
}

export const RevokeInviteDialog = forwardRef<RevokeInviteDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [revokeInvite] = useRevokeInviteMutation({
    onCompleted(data) {
      if (data && data.revokeInvite) {
        addToast({
          message: translate('text_63208c711ce25db781407523'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getInvites'],
  })

  const [inviteInfos, setInviteInfos] = useState<
    { id: string; email: string; organizationName: string } | undefined
  >()

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setInviteInfos(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_63208c701ce25db781407430')}
      description={
        <Typography>
          {translate('text_63208c701ce25db78140743c', {
            memberEmail: inviteInfos?.email,
            organizationName: inviteInfos?.organizationName,
          })}
        </Typography>
      }
      onContinue={async () =>
        await revokeInvite({
          variables: { input: { id: inviteInfos?.id as string } },
        })
      }
      continueText={translate('text_63208c701ce25db78140745e')}
    />
  )
})

RevokeInviteDialog.displayName = 'RevokeInviteDialog'
