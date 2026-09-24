import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useDestroyGovernanceEntityMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation destroyGovernanceEntity($input: DestroyUsageAttributionTypeInput!) {
    destroyUsageAttributionType(input: $input) {
      id
    }
  }
`

export const useDeleteGovernanceEntityDialog = (): {
  openDeleteGovernanceEntityDialog: (entity: { id: string }) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const [destroyGovernanceEntity] = useDestroyGovernanceEntityMutation({
    refetchQueries: ({ errors }) =>
      errors?.length ? [] : ['getGovernanceEntities', 'getGovernanceEntitiesRoleCounts'],
  })

  const openDeleteGovernanceEntityDialog = ({ id }: { id: string }): void => {
    centralizedDialog.open({
      title: translate('text_1790258263571gh96is813m8'),
      description: translate('text_17902586874164cq2n2rdi9y'),
      colorVariant: 'danger',
      actionText: translate('text_1790258263571y2mjnbd2me1'),
      onAction: async () => {
        const { data } = await destroyGovernanceEntity({ variables: { input: { id } } })

        if (!data?.destroyUsageAttributionType?.id) return

        addToast({ severity: 'success', translateKey: 'text_1790258263571oi5bbtne9ts' })
      },
    })
  }

  return { openDeleteGovernanceEntityDialog }
}
