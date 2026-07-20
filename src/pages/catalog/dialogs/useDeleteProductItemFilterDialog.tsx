import { gql, useApolloClient } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  ProductItemFilterForDeleteProductItemFilterDialogFragment,
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
          // Tasks 6 (list) and 11 (nested preview) will add their generated query
          // documents (ProductItemFiltersDocument, GetProductItemFiltersForProductItemDetailsDocument)
          // to this array once those queries exist. The cache-collection cleanup runs
          // regardless; no surface renders this dialog before Task 6.
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'ProductItemFilter',
            listFieldName: 'productItemFilters',
            listQueryDocument: [],
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
