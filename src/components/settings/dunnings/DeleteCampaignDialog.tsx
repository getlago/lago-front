import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeleteCampaignFragment, useDeleteDunningCampaignMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteCampaign on DunningCampaign {
    id
    appliedToOrganization
  }

  mutation deleteDunningCampaign($input: DestroyDunningCampaignInput!) {
    destroyDunningCampaign(input: $input) {
      id
    }
  }
`

export interface DeleteCampaignDialogRef {
  openDialog: (props: DeleteCampaignFragment) => unknown
  closeDialog: () => unknown
}

export const DeleteCampaignDialog = forwardRef<DeleteCampaignDialogRef, unknown>((_props, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<DeleteCampaignFragment>()

  const [deleteDunningCampaign] = useDeleteDunningCampaignMutation({
    refetchQueries: ['getDunningCampaigns'],
    onCompleted: ({ destroyDunningCampaign }) => {
      if (!destroyDunningCampaign) {
        return
      }

      addToast({
        severity: 'success',
        message: translate('text_1732187313660ayamm4mu716'),
      })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (props) => {
      setLocalData(props)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      setLocalData(undefined)
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_17321873136600ctyqurb2n2')}
      description={
        localData?.appliedToOrganization
          ? translate('text_1732187375488dzhyehimjs3')
          : translate('text_1732187375488g4igt5sf7kg')
      }
      onContinue={async () => {
        await deleteDunningCampaign({
          variables: {
            input: {
              id: localData?.id || '',
            },
          },
        })
      }}
      continueText={translate('text_1732187313660we30lb9kg57')}
    />
  )
})

DeleteCampaignDialog.displayName = 'DeleteCampaignDialog'
