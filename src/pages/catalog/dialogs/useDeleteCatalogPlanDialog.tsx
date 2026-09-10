import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  CatalogPlanForDeleteCatalogPlanDialogFragment,
  useDestroyCatalogPlanMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CATALOG_PLAN_DELETE_SUCCESS_TOAST_KEY = 'text_1789030049528v8irxwbj529'

gql`
  fragment CatalogPlanForDeleteCatalogPlanDialog on CatalogPlan {
    id
    name
  }

  mutation destroyCatalogPlan($input: DestroyCatalogPlanInput!) {
    destroyCatalogPlan(input: $input) {
      id
    }
  }
`

type DeleteCatalogPlanDialogProps = {
  catalogPlan: CatalogPlanForDeleteCatalogPlanDialogFragment
  callback?: () => void
}

export const useDeleteCatalogPlanDialog = (): {
  openDeleteCatalogPlanDialog: (args: DeleteCatalogPlanDialogProps) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [destroyCatalogPlan] = useDestroyCatalogPlanMutation()

  const openDeleteCatalogPlanDialog = ({
    catalogPlan,
    callback,
  }: DeleteCatalogPlanDialogProps): void => {
    centralizedDialog.open({
      title: translate('text_1789030049528hcqrjpyn74e', { name: catalogPlan.name }),
      description: translate('text_17890300495280w089r7yxn2'),
      colorVariant: 'danger',
      actionText: translate('text_63ea0f84f400488553caa786'),
      onAction: async (): Promise<void> => {
        const { data } = await destroyCatalogPlan({
          variables: { input: { id: catalogPlan.id } },
        })

        const destroyedId = data?.destroyCatalogPlan?.id

        if (!destroyedId) return

        evictFromCache(client, {
          id: destroyedId,
          __typename: 'CatalogPlan',
          listFieldName: 'catalogPlans',
          // No catalog plans list query exists yet, so there is no watcher to allow through.
          listQueryDocument: [],
        })

        callback?.()

        addToast({
          message: translate(CATALOG_PLAN_DELETE_SUCCESS_TOAST_KEY),
          severity: 'success',
        })
      },
    })
  }

  return { openDeleteCatalogPlanDialog }
}
