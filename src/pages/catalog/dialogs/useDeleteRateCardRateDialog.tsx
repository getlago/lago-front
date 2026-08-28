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

export const RATE_CARD_RATE_DELETE_DIALOG_TITLE_KEY = 'text_1787737220228vtfsw6cywjo'
export const RATE_CARD_RATE_DELETE_DIALOG_DESCRIPTION_KEY = 'text_17877372202281n4vwytee34'
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

  // Eviction below drops the row, but the counts it cannot reach - the list metadata's
  // `totalCount` and the card's `ratesCount` - come from the server.
  const [destroyRateCardRate] = useDestroyRateCardRateMutation({
    refetchQueries: RATE_CARD_RATE_DEPENDENT_QUERIES,
  })

  const openDeleteRateCardRateDialog = ({
    rate,
    callback,
  }: DeleteRateCardRateDialogProps): void => {
    centralizedDialog.open({
      title: translate(RATE_CARD_RATE_DELETE_DIALOG_TITLE_KEY, { code: rate.code }),
      description: translate(RATE_CARD_RATE_DELETE_DIALOG_DESCRIPTION_KEY),
      colorVariant: 'danger',
      actionText: translate('text_63ea0f84f400488553caa786'),
      onAction: async () => {
        const { data } = await destroyRateCardRate({
          variables: { input: { id: rate.id } },
        })

        const destroyedId = data?.destroyRateCardRate?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the global error
        // link surfaces it as an error toast.
        if (destroyedId) {
          // Alongside the refetch, not instead of it: eviction drops the deleted entity and
          // its row from the cached list pages straight away, so a still-mounted rate
          // details query re-reads nothing rather than a record the server already removed,
          // and the rates tab does not paint a stale row while the refetch is in flight.
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
