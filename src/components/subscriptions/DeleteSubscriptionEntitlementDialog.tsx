import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  RemoveSubscriptionEntitlementInput,
  useRemoveSubscriptionEntitlementMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation removeSubscriptionEntitlement($input: RemoveSubscriptionEntitlementInput!) {
    removeSubscriptionEntitlement(input: $input) {
      featureCode
    }
  }
`

type DeleteSubscriptionEntitlementDialogProps = RemoveSubscriptionEntitlementInput & {
  featureName: string
}

export interface DeleteSubscriptionEntitlementDialogRef {
  openDialog: (props: DeleteSubscriptionEntitlementDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteSubscriptionEntitlementDialog =
  forwardRef<DeleteSubscriptionEntitlementDialogRef>((_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [localData, setLocalData] = useState<
      DeleteSubscriptionEntitlementDialogProps | undefined
    >(undefined)
    const [removeSubscriptionEntitlement] = useRemoveSubscriptionEntitlementMutation({
      onCompleted(data) {
        if (!!data?.removeSubscriptionEntitlement?.featureCode) {
          addToast({
            message: translate('text_175585720878953maf5rsy64'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getEntitlementsForSubscriptionDetails'],
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
      <WarningDialog
        ref={dialogRef}
        title={translate('text_1755857208789vexq2o6uue8')}
        description={translate('text_17561254890563fn418c1xzd', {
          entitlementName: localData?.featureName,
        })}
        onContinue={async () =>
          !!localData &&
          (await removeSubscriptionEntitlement({
            variables: {
              input: {
                subscriptionId: localData?.subscriptionId,
                featureCode: localData?.featureCode,
              },
            },
          }))
        }
        continueText={translate('text_1756125489057n75k4pb2lbu')}
      />
    )
  })

DeleteSubscriptionEntitlementDialog.displayName = 'DeleteSubscriptionEntitlementDialog'
