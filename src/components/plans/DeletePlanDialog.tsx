import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { DeletePlanDialogFragment, useDeletePlanMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeletePlanDialog on Plan {
    id
    name
    draftInvoicesCount
    activeSubscriptionsCount
  }

  mutation deletePlan($input: DestroyPlanInput!) {
    destroyPlan(input: $input) {
      id
    }
  }
`

type DeletePlanDialogProps = {
  plan: DeletePlanDialogFragment
  callback?: () => void
}

export interface DeletePlanDialogRef {
  openDialog: ({ plan, callback }: DeletePlanDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeletePlanDialog = forwardRef<DeletePlanDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<DeletePlanDialogProps | undefined>(undefined)
  const {
    id = '',
    name = '',
    draftInvoicesCount = 0,
    activeSubscriptionsCount = 0,
  } = localData?.plan || {}

  const [deletePlan] = useDeletePlanMutation({
    onCompleted(data) {
      if (data && data.destroyPlan) {
        addToast({
          message: translate('text_625fd165963a7b00c8f59879'),
          severity: 'success',
        })

        localData?.callback && localData.callback()
      }
    },
    refetchQueries: ['plans'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_625fd165963a7b00c8f59797', {
        planName: name,
      })}
      description={translate(
        'text_63d18bdc54f8380e7a97351a',
        draftInvoicesCount > 0 && activeSubscriptionsCount > 0
          ? {
              usedObject1: translate(
                'text_63d18d34f90cc83a038f843b',
                { count: activeSubscriptionsCount },
                activeSubscriptionsCount,
              ),
              usedObject2: translate(
                'text_63d18d3edaed7e11710b4d25',
                { count: draftInvoicesCount },
                draftInvoicesCount,
              ),
            }
          : {
              usedObject1:
                activeSubscriptionsCount > 0
                  ? translate(
                      'text_63d18d34f90cc83a038f843b',
                      { count: activeSubscriptionsCount },
                      activeSubscriptionsCount,
                    )
                  : draftInvoicesCount > 0
                    ? translate(
                        'text_63d18d3edaed7e11710b4d25',
                        { count: draftInvoicesCount },
                        draftInvoicesCount,
                      )
                    : translate('text_63d18d34f90cc83a038f843b', { count: 0 }, 0),
            },
        draftInvoicesCount > 0 && activeSubscriptionsCount > 0 ? 2 : 0,
      )}
      onContinue={async () =>
        await deletePlan({
          variables: { input: { id } },
        })
      }
      continueText={translate('text_625fd165963a7b00c8f597b5')}
    />
  )
})

DeletePlanDialog.displayName = 'DeletePlanDialog'
