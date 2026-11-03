import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  LagoApiError,
  useDeletePlanDialogCountsQuery,
  useDeletePlanMutation,
} from '~/generated/graphql'
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

const LOADING_ERROR_MESSAGE = 'loading'

type DeletePlanDialogProps = {
  plan: { id: string; name: string }
  callback?: () => void
}

type DeletePlanDialogDescriptionProps = {
  planId: string
  readyRef: React.MutableRefObject<boolean>
}

const DeletePlanDialogDescription = ({ planId, readyRef }: DeletePlanDialogDescriptionProps) => {
  const { translate } = useInternationalization()
  const { data, loading, error } = useDeletePlanDialogCountsQuery({
    variables: { id: planId },
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  useEffect(() => {
    readyRef.current = !loading && !error && !!data?.plan
  }, [loading, error, data, readyRef])

  if (loading && !data) {
    return <Skeleton variant="text" />
  }

  if (error || !data?.plan) {
    return <Typography color="danger600">{translate('text_62b31e1f6a5b8b1b745ece48')}</Typography>
  }

  const { draftInvoicesCount, activeSubscriptionsCount } = data.plan
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
  const readyRef = useRef(false)

  const [deletePlan] = useDeletePlanMutation({
    refetchQueries: ['plans'],
  })

  const centralizedDialog = useCentralizedDialog()

  const onError = (error: Error): void => {
    if (error.message === LOADING_ERROR_MESSAGE) return

    addToast({
      severity: 'danger',
      translateKey: 'text_62b31e1f6a5b8b1b745ece48',
    })
  }

  const openDeletePlanDialog = ({ plan, callback }: DeletePlanDialogProps) => {
    const { id, name } = plan

    readyRef.current = false

    centralizedDialog.open({
      title: translate('text_625fd165963a7b00c8f59797', {
        planName: name,
      }),
      description: <DeletePlanDialogDescription planId={id} readyRef={readyRef} />,
      colorVariant: 'danger',
      actionText: translate('text_625fd165963a7b00c8f597b5'),
      closeOnError: false,
      onError,
      onAction: async () => {
        if (!readyRef.current) {
          throw new Error(LOADING_ERROR_MESSAGE)
        }

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
