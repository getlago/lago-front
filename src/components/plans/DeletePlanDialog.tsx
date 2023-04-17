import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { DeletePlanDialogFragment, useDeletePlanMutation } from '~/generated/graphql'
import { WarningDialog } from '~/components/WarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'

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

export interface DeletePlanDialogRef {
  openDialog: (billableMetric: DeletePlanDialogFragment) => unknown
  closeDialog: () => unknown
}

export const DeletePlanDialog = forwardRef<DeletePlanDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [plan, setPlan] = useState<DeletePlanDialogFragment | undefined>(undefined)
  const { id = '', name = '', draftInvoicesCount = 0, activeSubscriptionsCount = 0 } = plan || {}

  const [deletePlan] = useDeletePlanMutation({
    onCompleted(data) {
      if (data && data.destroyPlan) {
        addToast({
          message: translate('text_625fd165963a7b00c8f59879'),
          severity: 'success',
        })
      }
    },
    update(cache, { data }) {
      if (!data?.destroyPlan) return

      const cacheId = cache.identify({
        id: data?.destroyPlan.id,
        __typename: 'Plan',
      })

      cache.evict({ id: cacheId })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setPlan(data)
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
                activeSubscriptionsCount
              ),
              usedObject2: translate(
                'text_63d18d3edaed7e11710b4d25',
                { count: draftInvoicesCount },
                draftInvoicesCount
              ),
            }
          : {
              usedObject1:
                activeSubscriptionsCount > 0
                  ? translate(
                      'text_63d18d34f90cc83a038f843b',
                      { count: activeSubscriptionsCount },
                      activeSubscriptionsCount
                    )
                  : draftInvoicesCount > 0
                  ? translate(
                      'text_63d18d3edaed7e11710b4d25',
                      { count: draftInvoicesCount },
                      draftInvoicesCount
                    )
                  : translate('text_63d18d34f90cc83a038f843b', { count: 0 }, 0),
            },
        draftInvoicesCount > 0 && activeSubscriptionsCount > 0 ? 2 : 0
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
