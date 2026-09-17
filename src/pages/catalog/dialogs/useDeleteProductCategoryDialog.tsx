import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  ProductCategoriesDocument,
  ProductCategoryForDeleteProductCategoryDialogFragment,
  useDeleteProductCategoryMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductCategoryForDeleteProductCategoryDialog on ProductCategory {
    id
    name
  }

  mutation deleteProductCategory($input: DestroyProductCategoryInput!) {
    destroyProductCategory(input: $input) {
      id
    }
  }
`

type DeleteProductCategoryDialogProps = {
  productCategory: ProductCategoryForDeleteProductCategoryDialogFragment
  callback?: () => void
}

export const useDeleteProductCategoryDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteProductCategory] = useDeleteProductCategoryMutation()

  const openDeleteProductCategoryDialog = ({
    productCategory,
    callback,
  }: DeleteProductCategoryDialogProps) => {
    centralizedDialog.open({
      title: translate('text_1783627031283dfpxgl9r41e', {
        productCategoryName: productCategory.name,
      }),
      description: translate('text_178362703128385dvkieytgl'),
      colorVariant: 'danger',
      actionText: translate('text_1783627031283vpb5h6gacvj'),
      onAction: async () => {
        const { data } = await deleteProductCategory({
          variables: {
            input: {
              id: productCategory.id,
            },
          },
        })

        const destroyedId = data?.destroyProductCategory?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache).
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'ProductCategory',
            listFieldName: 'productCategories',
            listQueryDocument: ProductCategoriesDocument,
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

  return { openDeleteProductCategoryDialog }
}
