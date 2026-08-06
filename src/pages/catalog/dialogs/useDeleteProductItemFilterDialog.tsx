import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetProductItemFiltersForProductItemDetailsDocument,
  ProductItemFilterForDeleteProductItemFilterDialogFragment,
  ProductItemFiltersDocument,
  useDeleteProductItemFilterMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ProductItemFilterForDeleteProductItemFilterDialog on ProductItemFilter {
    id
    name
  }

  mutation deleteProductItemFilter($input: DestroyProductItemFilterInput!) {
    destroyProductItemFilter(input: $input) {
      id
    }
  }
`

type DeleteProductItemFilterDialogProps = {
  productItemFilter: ProductItemFilterForDeleteProductItemFilterDialogFragment
  callback?: () => void
}

export const useDeleteProductItemFilterDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteProductItemFilter] = useDeleteProductItemFilterMutation()

  const openDeleteProductItemFilterDialog = ({
    productItemFilter,
    callback,
  }: DeleteProductItemFilterDialogProps) => {
    centralizedDialog.open({
      title: translate('text_17845809313441m5o9s4s87a', {
        productItemFilterName: productItemFilter.name,
      }),
      description: translate('text_1784580931344h5s8k9g2ovw'),
      colorVariant: 'danger',
      actionText: translate('text_1784580931344s54qxlevbcb'),
      onAction: async () => {
        const { data } = await deleteProductItemFilter({
          variables: {
            input: {
              id: productItemFilter.id,
            },
          },
        })

        const destroyedId = data?.destroyProductItemFilter?.id

        // A backend rejection resolves without data (errorPolicy 'all'); the
        // global error link surfaces it as an error toast.
        if (destroyedId) {
          // Evict instead of refetching the list so a still-mounted details
          // query is not driven to a post-delete 404 (see evictFromCache).
          // Both the standalone list and the product-item-details preview read
          // the same cached filters, so a delete from either live-updates both.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'ProductItemFilter',
            listFieldName: 'productItemFilters',
            listQueryDocument: [
              ProductItemFiltersDocument,
              GetProductItemFiltersForProductItemDetailsDocument,
            ],
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

  return { openDeleteProductItemFilterDialog }
}
