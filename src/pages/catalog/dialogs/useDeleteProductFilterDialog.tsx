import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetProductFiltersForProductDetailsDocument,
  ProductFilterForDeleteProductFilterDialogFragment,
  ProductFiltersDocument,
  useDeleteProductFilterMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductFilterForDeleteProductFilterDialog on ProductFilter {
    id
    name
  }

  mutation deleteProductFilter($input: DestroyProductFilterInput!) {
    destroyProductFilter(input: $input) {
      id
    }
  }
`

type DeleteProductFilterDialogProps = {
  productFilter: ProductFilterForDeleteProductFilterDialogFragment
  callback?: () => void
}

export const useDeleteProductFilterDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteProductFilter] = useDeleteProductFilterMutation()

  const openDeleteProductFilterDialog = ({
    productFilter,
    callback,
  }: DeleteProductFilterDialogProps) => {
    centralizedDialog.open({
      title: translate('text_17845809313441m5o9s4s87a', {
        productFilterName: productFilter.name,
      }),
      description: translate('text_1784580931344h5s8k9g2ovw'),
      colorVariant: 'danger',
      actionText: translate('text_1784580931344s54qxlevbcb'),
      onAction: async () => {
        const { data } = await deleteProductFilter({
          variables: {
            input: {
              id: productFilter.id,
            },
          },
        })

        const destroyedId = data?.destroyProductFilter?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache).
          // Both the standalone list and the product-item-details preview read
          // the same cached filters, so a delete from either live-updates both.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'ProductFilter',
            listFieldName: 'productFilters',
            listQueryDocument: [ProductFiltersDocument, GetProductFiltersForProductDetailsDocument],
          })

          callback?.()

          addToast({
            message: translate('text_1784581042201wnl8rlwi1nh'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteProductFilterDialog }
}
