import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ProductDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { PRODUCT_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  LagoApiError,
  ProductForDrawerFragment,
  ProductTypeEnum,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID,
  PRODUCT_ITEM_FORM_DEFAULTS,
  PRODUCT_ITEM_FORM_ID,
  ProductFormValues,
} from './constants'
import { ComboboxSeed, ProductDrawerContent } from './ProductDrawerContent'

gql`
  fragment ProductForDrawer on Product {
    id
    name
    code
    description
    invoiceDisplayName
    productType
    attachedToPlanOrSubscription
    productCategory {
      id
      name
      code
    }
    billableMetric {
      id
      name
      code
    }
  }

  mutation createProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      ...ProductForDrawer
    }
  }

  mutation updateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      ...ProductForDrawer
    }
  }
`

const productDrawerSchema = z
  .object({
    name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    description: z.string(),
    invoiceDisplayName: z.string(),
    productCategoryId: z.string(),
    productType: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    billableMetricId: z.string(),
  })
  .superRefine((values, ctx) => {
    // A usage item bills against a billable metric; the API leaves it optional
    // so the requirement is enforced here.
    if (values.productType === ProductTypeEnum.Usage && !values.billableMetricId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billableMetricId'],
        message: 'text_624ea7c29103fd010732ab7d',
      })
    }
  })

const mapProductToFormValues = (product: ProductForDrawerFragment): ProductFormValues => ({
  name: product.name,
  code: product.code,
  description: product.description || '',
  invoiceDisplayName: product.invoiceDisplayName || '',
  productCategoryId: product.productCategory?.id || '',
  productType: product.productType,
  billableMetricId: product.billableMetric?.id || '',
})

type ProductCategoryAttachment = { id: string; name: string; code: string }

type ProductFormSuccess = {
  product: ProductForDrawerFragment
  wasEdit: boolean
}

const useProductForm = ({ onSuccess }: { onSuccess: (result: ProductFormSuccess) => void }) => {
  const editedProductRef = useRef<ProductForDrawerFragment | undefined>(undefined)

  const [createProduct] = useCreateProductMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    // Both names are refetched only if that query is currently active (mounted):
    // 'products' for the standalone list, 'getProductsForProductCategoryDetails'
    // for the product-details preview. An unmounted list is not refetched.
    refetchQueries: ['products', 'getProductsForProductCategoryDetails'],
  })
  const [updateProduct] = useUpdateProductMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProduct = editedProductRef.current

      let product: ProductForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); productType, productCategory
      // and billable metric are create-only, so they are not sent on update.
      if (editedProduct) {
        const result = await updateProduct({
          variables: {
            input: {
              id: editedProduct.id,
              name: value.name,
              code: value.code,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
            },
          },
        })

        product = result.data?.updateProduct
        errors = result.errors
      } else {
        const result = await createProduct({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              productType: value.productType as ProductTypeEnum,
              productCategoryId: value.productCategoryId || undefined,
              billableMetricId:
                value.productType === ProductTypeEnum.Usage
                  ? value.billableMetricId || undefined
                  : undefined,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        product = result.data?.createProduct
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (product) {
        onSuccess({ product, wasEdit: !!editedProduct })
      }
    },
  })

  const resetForm = (
    product?: ProductForDrawerFragment,
    attachToProductCategory?: ProductCategoryAttachment,
  ) => {
    editedProductRef.current = product

    if (product) {
      form.reset(mapProductToFormValues(product), { keepDefaultValues: true })
      return
    }

    form.reset(
      attachToProductCategory
        ? { ...PRODUCT_ITEM_FORM_DEFAULTS, productCategoryId: attachToProductCategory.id }
        : PRODUCT_ITEM_FORM_DEFAULTS,
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

type OpenProductDrawerArgs = {
  product?: ProductForDrawerFragment
  attachToProductCategory?: ProductCategoryAttachment
}

// Dual-mode drawer: `openDrawer()` creates a product, `openDrawer({ product })`
// edits it, and `openDrawer({ attachToProductCategory })` (used from the productCategory details tab)
// prefills the attached productCategory. Create mode carries the "Create more" footer toggle
// that keeps the drawer open, resets the form, and links the new item in the toast.
export const useProductDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remembers the productCategory to attach for the whole drawer session so the
  // "create more" reset (fired from onSuccess, outside openDrawer's scope)
  // can re-seed it instead of clearing the selection.
  const attachToProductCategoryRef = useRef<ProductCategoryAttachment | undefined>(undefined)

  const { form, resetForm } = useProductForm({
    onSuccess: ({ product, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1783980718114jtotg0hluib'),
        })
        return
      }

      const productDetailsPath = generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        // Re-seed the attached productCategory (if any) so the next item stays scoped to
        // the same productCategory instead of resetting to "no productCategory".
        resetForm(undefined, attachToProductCategoryRef.current)
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1783980718114wpjktwhgw5c', {
            productName: escapeDoubleQuotes(product.name),
            productUrl: prependOrgSlug(productDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(productDetailsPath)
      addToast({
        severity: 'success',
        message: translate('text_1783980718113u0nftkjemj1'),
      })
    },
  })

  const openDrawer = ({ product, attachToProductCategory }: OpenProductDrawerArgs = {}) => {
    attachToProductCategoryRef.current = attachToProductCategory
    resetCreateMore()
    resetForm(product, attachToProductCategory)

    const productCategorySource = product?.productCategory ?? attachToProductCategory
    const productCategorySeed: ComboboxSeed = productCategorySource
      ? { value: productCategorySource.id, label: productCategorySource.name }
      : null
    const billableMetricSeed: ComboboxSeed = product?.billableMetric
      ? { value: product.billableMetric.id, label: product.billableMetric.name }
      : null

    drawer.open({
      title: product
        ? translate('text_1783980718113x99ykq6zvpi')
        : translate('text_1783622030703m9jlurg4jsn'),
      form: { id: PRODUCT_ITEM_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: product ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID}>
            {translate(product ? 'text_17295436903260tlyb1gp1i7' : 'text_1783980718113c63agwciyi5')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ProductDrawerContent
          form={form}
          isEdit={!!product}
          disableCodeInput={!!product?.attachedToPlanOrSubscription}
          productCategorySeed={productCategorySeed}
          billableMetricSeed={billableMetricSeed}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
