import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetRateCardsForProductDetailsDocument,
  GetRateCardsForProductFilterDetailsDocument,
  RateCardForDeleteRateCardDialogFragment,
  RateCardsDocument,
  useDestroyRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_CARD_DELETE_DIALOG_TITLE_KEY = 'text_1784922347134rd7big6t42p'
export const RATE_CARD_DELETE_DIALOG_DESCRIPTION_KEY = 'text_17849223471357gz7cpjn0ov'
export const RATE_CARD_DELETE_SUCCESS_TOAST_KEY = 'text_1784922347135r6bqokjjhpd'

gql`
  fragment RateCardForDeleteRateCardDialog on RateCard {
    id
    name
  }

  mutation destroyRateCard($input: DestroyRateCardInput!) {
    destroyRateCard(input: $input) {
      id
    }
  }
`

type DeleteRateCardDialogProps = {
  rateCard: RateCardForDeleteRateCardDialogFragment
  callback?: () => void
}

export const useDeleteRateCardDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [destroyRateCard] = useDestroyRateCardMutation()

  const openDeleteRateCardDialog = ({ rateCard, callback }: DeleteRateCardDialogProps) => {
    centralizedDialog.open({
      title: translate(RATE_CARD_DELETE_DIALOG_TITLE_KEY, {
        name: rateCard.name,
      }),
      description: translate(RATE_CARD_DELETE_DIALOG_DESCRIPTION_KEY),
      colorVariant: 'danger',
      actionText: translate('text_63ea0f84f400488553caa786'),
      onAction: async () => {
        const { data } = await destroyRateCard({
          variables: {
            input: {
              id: rateCard.id,
            },
          },
        })

        const destroyedId = data?.destroyRateCard?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache). The
          // standalone list and both the product-item / product-item-filter
          // details previews read the same cached rate cards, so a delete from
          // any of them live-updates all three.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'RateCard',
            listFieldName: 'rateCards',
            listQueryDocument: [
              RateCardsDocument,
              GetRateCardsForProductDetailsDocument,
              GetRateCardsForProductFilterDetailsDocument,
            ],
          })

          callback?.()

          addToast({
            message: translate(RATE_CARD_DELETE_SUCCESS_TOAST_KEY),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteRateCardDialog }
}
