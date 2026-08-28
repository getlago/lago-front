import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ProductFilterDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { PRODUCT_FILTER_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import {
  LagoApiError,
  ProductFilterForDrawerFragment,
  useCreateProductFilterMutation,
  useUpdateProductFilterMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID,
  PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  PRODUCT_ITEM_FILTER_FORM_ID,
  productFilterDrawerSchema,
  ProductFilterFormValues,
} from './constants'
import {
  ComboboxSeed,
  ProductFilterDrawerContent,
  SelectableBillableMetricFilter,
} from './ProductFilterDrawerContent'

import { escapeDoubleQuotes } from '../../utils/escapeDoubleQuotes'

gql`
  fragment ProductFilterForDrawer on ProductFilter {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
    product {
      id
      name
      code
    }
    values {
      id
      value
      billableMetricFilter {
        id
        key
        values
      }
    }
  }

  query productsForItemFilterDrawer($page: Int, $limit: Int, $searchTerm: String) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
        invoiceDisplayName
        productType
        billableMetric {
          id
          filters {
            id
            key
            values
          }
        }
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }

  mutation createProductFilter($input: CreateProductFilterInput!) {
    createProductFilter(input: $input) {
      id
      ...ProductFilterForDrawer
    }
  }

  mutation updateProductFilter($input: UpdateProductFilterInput!) {
    updateProductFilter(input: $input) {
      id
      ...ProductFilterForDrawer
    }
  }
`

const mapProductFilterToFormValues = (
  productFilter: ProductFilterForDrawerFragment,
): ProductFilterFormValues => ({
  name: productFilter.name,
  code: productFilter.code,
  description: productFilter.description || '',
  invoiceDisplayName: productFilter.invoiceDisplayName || '',
  productId: productFilter.product.id,
  values: productFilter.values.map((value) => ({
    billableMetricFilterId: value.billableMetricFilter.id,
    // Backend returns null for an "all values" (parent-key) selection; normalize
    // to undefined so it maps back to the parent option in the values editor.
    value: value.value ?? undefined,
  })),
})

// The edit fragment only carries the billable metric filters that already have a
// selected value; deduplicate them into the "available filters" seed the values
// editor renders while the product combobox stays disabled.
const mapSeededFilters = (
  productFilter: ProductFilterForDrawerFragment,
): SelectableBillableMetricFilter[] => {
  const byId = new Map<string, SelectableBillableMetricFilter>()

  productFilter.values.forEach(({ billableMetricFilter }) => {
    byId.set(billableMetricFilter.id, {
      id: billableMetricFilter.id,
      key: billableMetricFilter.key,
      values: billableMetricFilter.values,
    })
  })

  return Array.from(byId.values())
}

type ProductAttachment = {
  id: string
  name: string
  code: string
  billableMetricFilters: SelectableBillableMetricFilter[]
}

type ProductFilterFormSuccess = {
  productFilter: ProductFilterForDrawerFragment
  wasEdit: boolean
}

const useProductFilterForm = ({
  onSuccess,
}: {
  onSuccess: (result: ProductFilterFormSuccess) => void
}) => {
  const editedProductFilterRef = useRef<ProductFilterForDrawerFragment | undefined>(undefined)

  const [createProductFilter] = useCreateProductFilterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    // Both names are refetched only if that query is currently active (mounted):
    // 'productFilters' for the standalone list, and the product-item-details
    // preview list. An unmounted list is not refetched.
    refetchQueries: ['productFilters', 'getProductFiltersForProductDetails'],
  })
  const [updateProductFilter] = useUpdateProductFilterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productFilterDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProductFilter = editedProductFilterRef.current

      const values = value.values.map((entry) => ({
        billableMetricFilterId: entry.billableMetricFilterId,
        value: entry.value,
      }))

      let productFilter: ProductFilterForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); the attached productCategory
      // item is create-only, so productId is not sent on update.
      if (editedProductFilter) {
        const result = await updateProductFilter({
          variables: {
            input: {
              id: editedProductFilter.id,
              name: value.name,
              code: value.code,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
              values,
            },
          },
        })

        productFilter = result.data?.updateProductFilter
        errors = result.errors
      } else {
        const result = await createProductFilter({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              productId: value.productId,
              values,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        productFilter = result.data?.createProductFilter
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (productFilter) {
        onSuccess({ productFilter, wasEdit: !!editedProductFilter })
      }
    },
  })

  const resetForm = (
    productFilter?: ProductFilterForDrawerFragment,
    attachToProduct?: ProductAttachment,
  ) => {
    editedProductFilterRef.current = productFilter

    if (productFilter) {
      form.reset(mapProductFilterToFormValues(productFilter), { keepDefaultValues: true })
      return
    }

    form.reset(
      attachToProduct
        ? { ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS, productId: attachToProduct.id }
        : PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

type OpenProductFilterDrawerArgs = {
  productFilter?: ProductFilterForDrawerFragment
  attachToProduct?: ProductAttachment
}

// Dual-mode drawer: `openDrawer()` creates an item filter, `openDrawer({ productFilter })`
// edits it, and `openDrawer({ attachToProduct })` (used from the product details tab)
// prefills the attached product. Create mode carries the "Create more" footer toggle
// that keeps the drawer open, resets the form, and links the new filter in the toast.
export const useProductFilterDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remembers the product to attach for the whole drawer session so the
  // "create more" reset (fired from onSuccess, outside openDrawer's scope) can
  // re-seed it instead of clearing the selection.
  const attachToProductRef = useRef<ProductAttachment | undefined>(undefined)

  const { form, resetForm } = useProductFilterForm({
    onSuccess: ({ productFilter, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1784579158112yn0ioe02z9r'),
        })
        return
      }

      const productFilterDetailsPath = generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
        productFilterId: productFilter.id,
        tab: ProductFilterDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        // Re-seed the attached product (if any) so the next filter stays
        // scoped to the same product instead of resetting to none.
        resetForm(undefined, attachToProductRef.current)
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1784579158112phjg1rsk7kb', {
            productFilterName: escapeDoubleQuotes(productFilter.name),
            productFilterUrl: prependOrgSlug(productFilterDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(productFilterDetailsPath)
      addToast({
        severity: 'success',
        message: translate('text_17845791581125eyy6m5pmbc'),
      })
    },
  })

  const openDrawer = ({ productFilter, attachToProduct }: OpenProductFilterDrawerArgs = {}) => {
    attachToProductRef.current = attachToProduct
    resetCreateMore()
    resetForm(productFilter, attachToProduct)

    const isEdit = !!productFilter
    const productSource = productFilter?.product ?? attachToProduct
    const productSeed: ComboboxSeed = productSource
      ? { value: productSource.id, label: productSource.name }
      : null
    const seededFilters = productFilter
      ? mapSeededFilters(productFilter)
      : (attachToProduct?.billableMetricFilters ?? [])

    drawer.open({
      title: isEdit
        ? translate('text_1784579021079qarjon667xy')
        : translate('text_178603116671032mnf3wr3e3'),
      form: { id: PRODUCT_ITEM_FILTER_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: isEdit ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID}>
            {translate(isEdit ? 'text_17295436903260tlyb1gp1i7' : 'text_1742230191029lznwj3y41nb')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ProductFilterDrawerContent
          form={form}
          isEdit={isEdit}
          disableCodeInput={!!productFilter?.attachedToPlanOrSubscription}
          productSeed={productSeed}
          seededFilters={seededFilters}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
