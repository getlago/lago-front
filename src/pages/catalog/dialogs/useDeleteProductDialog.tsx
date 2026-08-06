import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  ProductForDeleteProductDialogFragment,
  ProductsDocument,
  useDeleteProductMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductForDeleteProductDialog on Product {
    id
    name
  }

  mutation deleteProduct($input: DestroyProductInput!) {
    destroyProduct(input: $input) {
      id
    }
  }
`

type DeleteProductDialogProps = {
  product: ProductForDeleteProductDialogFragment
  callback?: () => void
}

export const useDeleteProductDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteProduct] = useDeleteProductMutation()

  const openDeleteProductDialog = ({ product, callback }: DeleteProductDialogProps) => {
    centralizedDialog.open({
      title: translate('text_1783627031283dfpxgl9r41e', { productName: product.name }),
      description: translate('text_178362703128385dvkieytgl'),
      colorVariant: 'danger',
      actionText: translate('text_1783627031283vpb5h6gacvj'),
      onAction: async () => {
        const { data } = await deleteProduct({
          variables: {
            input: {
              id: product.id,
            },
          },
        })

        const destroyedId = data?.destroyProduct?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache).
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'Product',
            listFieldName: 'products',
            listQueryDocument: ProductsDocument,
          })

          callback?.()

          addToast({
            message: translate('text_17836270312831a7f7gdaxir'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteProductDialog }
}
