import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ProductItemFilterDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { PRODUCT_ITEM_FILTER_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import {
  BillableMetricFilter,
  LagoApiError,
  ProductItemFilterForDrawerFragment,
  useCreateProductItemFilterMutation,
  useUpdateProductItemFilterMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID,
  PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
  PRODUCT_ITEM_FILTER_FORM_ID,
  ProductItemFilterFormValues,
} from './constants'
import { ComboboxSeed, ProductItemFilterDrawerContent } from './ProductItemFilterDrawerContent'

gql`
  fragment ProductItemFilterForDrawer on ProductItemFilter {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
    productItem {
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

  query productItemsForItemFilterDrawer($page: Int, $limit: Int, $searchTerm: String) {
    productItems(page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
        invoiceDisplayName
        itemType
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

  mutation createProductItemFilter($input: CreateProductItemFilterInput!) {
    createProductItemFilter(input: $input) {
      id
      ...ProductItemFilterForDrawer
    }
  }

  mutation updateProductItemFilter($input: UpdateProductItemFilterInput!) {
    updateProductItemFilter(input: $input) {
      id
      ...ProductItemFilterForDrawer
    }
  }
`

type SelectableBillableMetricFilter = Pick<BillableMetricFilter, 'id' | 'key' | 'values'>

const productItemFilterDrawerSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  description: z.string(),
  invoiceDisplayName: z.string(),
  productItemId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  values: z
    .array(z.object({ billableMetricFilterId: z.string(), value: z.string() }))
    .min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})

const mapProductItemFilterToFormValues = (
  productItemFilter: ProductItemFilterForDrawerFragment,
): ProductItemFilterFormValues => ({
  name: productItemFilter.name,
  code: productItemFilter.code,
  description: productItemFilter.description || '',
  invoiceDisplayName: productItemFilter.invoiceDisplayName || '',
  productItemId: productItemFilter.productItem.id,
  values: productItemFilter.values.map((value) => ({
    billableMetricFilterId: value.billableMetricFilter.id,
    value: value.value,
  })),
})

// The edit fragment only carries the billable metric filters that already have a
// selected value; deduplicate them into the "available filters" seed the values
// editor renders while the product item combobox stays disabled.
const mapSeededFilters = (
  productItemFilter: ProductItemFilterForDrawerFragment,
): SelectableBillableMetricFilter[] => {
  const byId = new Map<string, SelectableBillableMetricFilter>()

  productItemFilter.values.forEach(({ billableMetricFilter }) => {
    byId.set(billableMetricFilter.id, {
      id: billableMetricFilter.id,
      key: billableMetricFilter.key,
      values: billableMetricFilter.values,
    })
  })

  return Array.from(byId.values())
}

// `data-text` is a double-quoted HTML attribute in the linked-toast template;
// escape embedded quotes so a product item filter name cannot break out of it.
const escapeDoubleQuotes = (value: string) => value.replaceAll('"', '&quot;')

type ProductItemAttachment = { id: string; name: string; code: string }

type ProductItemFilterFormSuccess = {
  productItemFilter: ProductItemFilterForDrawerFragment
  wasEdit: boolean
}

const useProductItemFilterForm = ({
  onSuccess,
}: {
  onSuccess: (result: ProductItemFilterFormSuccess) => void
}) => {
  const editedProductItemFilterRef = useRef<ProductItemFilterForDrawerFragment | undefined>(
    undefined,
  )

  const [createProductItemFilter] = useCreateProductItemFilterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    // Both names are refetched only if that query is currently active (mounted):
    // 'productItemFilters' for the standalone list, and the product-item-details
    // preview list. An unmounted list is not refetched.
    refetchQueries: ['productItemFilters', 'getProductItemFiltersForProductItemDetails'],
  })
  const [updateProductItemFilter] = useUpdateProductItemFilterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productItemFilterDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProductItemFilter = editedProductItemFilterRef.current

      const values = value.values.map((entry) => ({
        billableMetricFilterId: entry.billableMetricFilterId,
        value: entry.value,
      }))

      let productItemFilter: ProductItemFilterForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); the attached product
      // item is create-only, so productItemId is not sent on update.
      if (editedProductItemFilter) {
        const result = await updateProductItemFilter({
          variables: {
            input: {
              id: editedProductItemFilter.id,
              name: value.name,
              code: value.code,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
              values,
            },
          },
        })

        productItemFilter = result.data?.updateProductItemFilter
        errors = result.errors
      } else {
        const result = await createProductItemFilter({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              productItemId: value.productItemId,
              values,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        productItemFilter = result.data?.createProductItemFilter
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (productItemFilter) {
        onSuccess({ productItemFilter, wasEdit: !!editedProductItemFilter })
      }
    },
  })

  const resetForm = (
    productItemFilter?: ProductItemFilterForDrawerFragment,
    attachToProductItem?: ProductItemAttachment,
  ) => {
    editedProductItemFilterRef.current = productItemFilter

    if (productItemFilter) {
      form.reset(mapProductItemFilterToFormValues(productItemFilter), { keepDefaultValues: true })
      return
    }

    form.reset(
      attachToProductItem
        ? { ...PRODUCT_ITEM_FILTER_FORM_DEFAULTS, productItemId: attachToProductItem.id }
        : PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

type OpenProductItemFilterDrawerArgs = {
  productItemFilter?: ProductItemFilterForDrawerFragment
  attachToProductItem?: ProductItemAttachment
}

// Dual-mode drawer: `openDrawer()` creates an item filter, `openDrawer({ productItemFilter })`
// edits it, and `openDrawer({ attachToProductItem })` (used from the product item details tab)
// prefills the attached product item. Create mode carries the "Create more" footer toggle
// that keeps the drawer open, resets the form, and links the new filter in the toast.
export const useProductItemFilterDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remembers the product item to attach for the whole drawer session so the
  // "create more" reset (fired from onSuccess, outside openDrawer's scope) can
  // re-seed it instead of clearing the selection.
  const attachToProductItemRef = useRef<ProductItemAttachment | undefined>(undefined)

  const { form, resetForm } = useProductItemFilterForm({
    onSuccess: ({ productItemFilter, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1784579158112yn0ioe02z9r'),
        })
        return
      }

      const productItemFilterDetailsPath = generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
        productItemFilterId: productItemFilter.id,
        tab: ProductItemFilterDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        // Re-seed the attached product item (if any) so the next filter stays
        // scoped to the same product item instead of resetting to none.
        resetForm(undefined, attachToProductItemRef.current)
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1784579158112phjg1rsk7kb', {
            productItemFilterName: escapeDoubleQuotes(productItemFilter.name),
            productItemFilterUrl: prependOrgSlug(productItemFilterDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(productItemFilterDetailsPath)
      addToast({
        severity: 'success',
        message: translate('text_17845791581125eyy6m5pmbc'),
      })
    },
  })

  const openDrawer = ({
    productItemFilter,
    attachToProductItem,
  }: OpenProductItemFilterDrawerArgs = {}) => {
    attachToProductItemRef.current = attachToProductItem
    resetCreateMore()
    resetForm(productItemFilter, attachToProductItem)

    const isEdit = !!productItemFilter
    const productItemSource = productItemFilter?.productItem ?? attachToProductItem
    const productItemSeed: ComboboxSeed = productItemSource
      ? { value: productItemSource.id, label: productItemSource.name }
      : null
    const seededFilters = productItemFilter ? mapSeededFilters(productItemFilter) : []

    drawer.open({
      title: isEdit
        ? translate('text_1784579021079qarjon667xy')
        : translate('text_17836220307039rf790f045t'),
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
        <ProductItemFilterDrawerContent
          form={form}
          isEdit={isEdit}
          disableCodeInput={!!productItemFilter?.attachedToPlanOrSubscription}
          productItemSeed={productItemSeed}
          seededFilters={seededFilters}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
