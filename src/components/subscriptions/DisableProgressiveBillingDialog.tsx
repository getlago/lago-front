import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { useDisableSubscriptionProgressiveBillingMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation disableSubscriptionProgressiveBilling($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      progressiveBillingDisabled
    }
  }
`

type DisableProgressiveBillingDialogProps = {
  subscriptionId: string
  subscriptionName: string
}

export interface DisableProgressiveBillingDialogRef {
  openDialog: (data: DisableProgressiveBillingDialogProps) => void
  closeDialog: () => void
}

export const DisableProgressiveBillingDialog = forwardRef<DisableProgressiveBillingDialogRef>(
  (_, ref) => {
    const dialogRef = useRef<DialogRef>(null)
    const { translate } = useInternationalization()
    const [localData, setLocalData] = useState<DisableProgressiveBillingDialogProps | null>(null)

    const [disableProgressiveBilling] = useDisableSubscriptionProgressiveBillingMutation({
      onCompleted({ updateSubscription: result }) {
        if (result?.id) {
          addToast({
            severity: 'success',
            translateKey: 'text_1738071730498disablesuccess',
          })
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
        title={translate('text_1738071730498n89s1p0z8b4')}
        description={
          <Typography
            variant="body"
            color="grey600"
            html={translate('text_1738071730498xnl4qgvmzeo', {
              subscriptionName: localData?.subscriptionName,
            })}
          />
        }
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <Button
              variant="primary"
              danger
              onClick={async () => {
                if (localData?.subscriptionId) {
                  await disableProgressiveBilling({
                    variables: {
                      input: {
                        id: localData.subscriptionId,
                        progressiveBillingDisabled: true,
                      },
                    },
                  })
                }
                closeDialog()
              }}
            >
              {translate('text_1738071730498bsjvn56ruzp')}
            </Button>
          </>
        )}
      />
    )
  },
)

DisableProgressiveBillingDialog.displayName = 'DisableProgressiveBillingDialog'
