import { gql } from '@apollo/client'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useDeletePlanDialogCountsQuery, useDeletePlanMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeletePlanDialog on Plan {
    id
    draftInvoicesCount
    activeSubscriptionsCount
  }

  query deletePlanDialogCounts($id: ID!) {
    plan(id: $id) {
      ...DeletePlanDialog
    }
  }

  mutation deletePlan($input: DestroyPlanInput!) {
    destroyPlan(input: $input) {
      id
    }
  }
`

type DeletePlanDialogProps = {
  plan: { id: string; name: string }
  callback?: () => void
}

const DeletePlanDialogDescription = ({ planId }: { planId: string }) => {
  const { translate } = useInternationalization()
  const { data, loading } = useDeletePlanDialogCountsQuery({ variables: { id: planId } })

  if (loading && !data) {
    return <Skeleton variant="text" />
  }

  const draftInvoicesCount = data?.plan?.draftInvoicesCount ?? 0
  const activeSubscriptionsCount = data?.plan?.activeSubscriptionsCount ?? 0
  const hasBothCounts = draftInvoicesCount > 0 && activeSubscriptionsCount > 0

  const getUsedObject1 = (): string => {
    if (activeSubscriptionsCount > 0) {
      return translate(
        'text_63d18d34f90cc83a038f843b',
        { count: activeSubscriptionsCount },
        activeSubscriptionsCount,
      )
    }
    if (draftInvoicesCount > 0) {
      return translate(
        'text_63d18d3edaed7e11710b4d25',
        { count: draftInvoicesCount },
        draftInvoicesCount,
      )
    }
    return translate('text_63d18d34f90cc83a038f843b', { count: 0 }, 0)
  }

  return (
    <>
      {translate(
        'text_63d18bdc54f8380e7a97351a',
        hasBothCounts
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
          : { usedObject1: getUsedObject1() },
        hasBothCounts ? 2 : 0,
      )}
    </>
  )
}

export const useDeletePlanDialog = () => {
  const { translate } = useInternationalization()

  const [deletePlan] = useDeletePlanMutation({
    refetchQueries: ['plans'],
  })

  const centralizedDialog = useCentralizedDialog()

  const openDeletePlanDialog = ({ plan, callback }: DeletePlanDialogProps) => {
    const { id, name } = plan

    centralizedDialog.open({
      title: translate('text_625fd165963a7b00c8f59797', {
        planName: name,
      }),
      description: <DeletePlanDialogDescription planId={id} />,
      colorVariant: 'danger',
      actionText: translate('text_625fd165963a7b00c8f597b5'),
      onAction: async () => {
        const result = await deletePlan({
          variables: { input: { id } },
        })

        if (result.data?.destroyPlan) {
          addToast({
            message: translate('text_625fd165963a7b00c8f59879'),
            severity: 'success',
          })

          callback?.()
        }
      },
    })
  }

  return { openDeletePlanDialog }
}
