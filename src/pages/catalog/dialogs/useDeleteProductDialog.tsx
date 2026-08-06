import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetProductsForProductCategoryDetailsDocument,
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
      title: translate('text_1783980718114rgp3b8u2b8y', { productName: product.name }),
      description: translate('text_1783980718114rt2un11i7wa'),
      colorVariant: 'danger',
      actionText: translate('text_17839807181152ujl4fo6wyy'),
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
          // Both list watchers read the same `products` root field: the
          // standalone list and the product-details preview. Passing both
          // documents lets each drop the row without a refetch.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'Product',
            listFieldName: 'products',
            listQueryDocument: [ProductsDocument, GetProductsForProductCategoryDetailsDocument],
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

  return { openDeleteProductDialog }
}
