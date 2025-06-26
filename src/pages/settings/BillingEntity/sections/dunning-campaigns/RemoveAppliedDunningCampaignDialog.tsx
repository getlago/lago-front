import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { BillingEntity, useRemoveBillingEntityDunningCampaignMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation removeBillingEntityDunningCampaign(
    $input: BillingEntityUpdateAppliedDunningCampaignInput!
  ) {
    billingEntityUpdateAppliedDunningCampaign(input: $input) {
      id
    }
  }
`

export type RemoveAppliedDunningCampaignDialogRef = {
  openDialog: (billingEntity: BillingEntity, appliedDunningCampaignId: string) => unknown
  closeDialog: () => unknown
}

export const RemoveAppliedDunningCampaignDialog = forwardRef<RemoveAppliedDunningCampaignDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)

    const [appliedDunningCampaignId, setAppliedDunningCampaignId] = useState<string | null>(null)
    const [billingEntity, setBillingEntity] = useState<BillingEntity | null>(null)

    const [removeBillingEntityDunningCampaign] = useRemoveBillingEntityDunningCampaignMutation({
      onCompleted(data) {
        if (data) {
          addToast({
            message: translate('text_1750663218391vbamspkjr5g'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getBillingEntity'],
    })

    useImperativeHandle(ref, () => ({
      openDialog: (_billingEntity, _appliedDunningCampaignId) => {
        setBillingEntity(_billingEntity)
        setAppliedDunningCampaignId(_appliedDunningCampaignId)

        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_1750663218391a7zbhnk61ce')}
        description={<Typography>{translate('text_1750663218391z2s6w2of7xp')}</Typography>}
        onContinue={async () => {
          if (billingEntity && appliedDunningCampaignId) {
            await removeBillingEntityDunningCampaign({
              variables: {
                input: {
                  appliedDunningCampaignId: null,
                  billingEntityId: billingEntity.id,
                },
              },
            })
          }
        }}
        continueText={translate('text_175066321839172gm0lkz8eu')}
      />
    )
  },
)

RemoveAppliedDunningCampaignDialog.displayName = 'RemoveAppliedDunningCampaignDialog'
