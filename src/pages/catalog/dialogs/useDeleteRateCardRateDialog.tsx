import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  RateCardRateForDeleteRateCardRateDialogFragment,
  RateCardRatesDocument,
  useDestroyRateCardRateMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RATE_CARD_RATE_DEPENDENT_QUERIES } from '../drawers/rateCardRate/constants'

export const RATE_CARD_RATE_DELETE_SUCCESS_TOAST_KEY = 'text_1787737220228n5sd5hs13kg'

gql`
  fragment RateCardRateForDeleteRateCardRateDialog on RateCardRate {
    id
    code
  }

  mutation destroyRateCardRate($input: DestroyRateCardRateInput!) {
    destroyRateCardRate(input: $input) {
      id
    }
  }
`

type DeleteRateCardRateDialogProps = {
  rate: RateCardRateForDeleteRateCardRateDialogFragment
  callback?: () => void
}

type UseDeleteRateCardRateDialogReturn = {
  openDeleteRateCardRateDialog: (props: DeleteRateCardRateDialogProps) => void
}

export const useDeleteRateCardRateDialog = (): UseDeleteRateCardRateDialogReturn => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [destroyRateCardRate] = useDestroyRateCardRateMutation({
    refetchQueries: RATE_CARD_RATE_DEPENDENT_QUERIES,
  })

  const openDeleteRateCardRateDialog = ({
    rate,
    callback,
  }: DeleteRateCardRateDialogProps): void => {
    centralizedDialog.open({
      title: translate('text_1787737220228vtfsw6cywjo', { code: rate.code }),
      description: translate('text_17877372202281n4vwytee34'),
      colorVariant: 'danger',
      actionText: translate('text_63ea0f84f400488553caa786'),
      onAction: async () => {
        const { data } = await destroyRateCardRate({
          variables: { input: { id: rate.id } },
        })

        const destroyedId = data?.destroyRateCardRate?.id

        // A rejection resolves without data (errorPolicy 'all'); the error link toasts it.
        if (destroyedId) {
          // Alongside the refetch, not instead of it: evicting drops the row immediately, the
          // refetch brings back the server-side counts.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'RateCardRate',
            listFieldName: 'rateCardRates',
            listQueryDocument: RateCardRatesDocument,
          })

          callback?.()

          addToast({
            message: translate(RATE_CARD_RATE_DELETE_SUCCESS_TOAST_KEY),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteRateCardRateDialog }
}
