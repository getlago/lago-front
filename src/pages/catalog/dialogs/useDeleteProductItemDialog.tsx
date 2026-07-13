import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  ProductItemForDeleteProductItemDialogFragment,
  ProductItemsDocument,
  useDeleteProductItemMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductItemForDeleteProductItemDialog on ProductItem {
    id
    name
  }

  mutation deleteProductItem($input: DestroyProductItemInput!) {
    destroyProductItem(input: $input) {
      id
    }
  }
`

type DeleteProductItemDialogProps = {
  productItem: ProductItemForDeleteProductItemDialogFragment
  callback?: () => void
}

export const useDeleteProductItemDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteProductItem] = useDeleteProductItemMutation()

  const openDeleteProductItemDialog = ({ productItem, callback }: DeleteProductItemDialogProps) => {
    centralizedDialog.open({
      title: translate('text_1783980718114rgp3b8u2b8y', { productItemName: productItem.name }),
      description: translate('text_1783980718114rt2un11i7wa'),
      colorVariant: 'danger',
      actionText: translate('text_17839807181152ujl4fo6wyy'),
      onAction: async () => {
        const { data } = await deleteProductItem({
          variables: {
            input: {
              id: productItem.id,
            },
          },
        })

        const destroyedId = data?.destroyProductItem?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache).
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'ProductItem',
            listFieldName: 'productItems',
            listQueryDocument: ProductItemsDocument,
          })

          callback?.()

          addToast({
            message: translate('text_1783980718115h8wwdamd5di'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteProductItemDialog }
}
