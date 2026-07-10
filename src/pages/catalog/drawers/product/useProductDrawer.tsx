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
import {
  LagoApiError,
  ProductForProductDrawerFragment,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { PRODUCT_FORM_DEFAULTS, PRODUCT_FORM_ID, ProductFormValues } from './constants'
import { ProductDrawerContent } from './ProductDrawerContent'

gql`
  fragment ProductForProductDrawer on Product {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
  }

  mutation createProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      ...ProductForProductDrawer
    }
  }

  mutation updateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      ...ProductForProductDrawer
    }
  }
`

const productDrawerSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  description: z.string(),
  invoiceDisplayName: z.string(),
})

const mapProductToFormValues = (product: ProductForProductDrawerFragment): ProductFormValues => ({
  name: product.name,
  code: product.code,
  description: product.description || '',
  invoiceDisplayName: product.invoiceDisplayName || '',
})

// `data-text` is a double-quoted HTML attribute in the linked-toast template;
// escape embedded quotes so a product name cannot break out of the attribute.
const escapeDoubleQuotes = (value: string) => value.replace(/"/g, '&quot;')

type ProductFormSuccess = {
  product: ProductForProductDrawerFragment
  wasEdit: boolean
}

const useProductForm = ({ onSuccess }: { onSuccess: (result: ProductFormSuccess) => void }) => {
  const editedProductRef = useRef<ProductForProductDrawerFragment | undefined>(undefined)

  const [createProduct] = useCreateProductMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['products'],
  })
  const [updateProduct] = useUpdateProductMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProduct = editedProductRef.current

      let product: ProductForProductDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); create omits them.
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

  const resetForm = (product?: ProductForProductDrawerFragment) => {
    editedProductRef.current = product
    form.reset(product ? mapProductToFormValues(product) : PRODUCT_FORM_DEFAULTS, {
      keepDefaultValues: true,
    })
  }

  return { form, resetForm }
}

// Dual-mode drawer: `openDrawer()` with no argument creates a product;
// `openDrawer(product)` edits it. Create mode carries the "Create more" footer
// toggle that keeps the drawer open, resets the form, and links the new product
// in the success toast.
export const useProductDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const { form, resetForm } = useProductForm({
    onSuccess: ({ product, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1783627031283gttzuphzl2o'),
        })
        return
      }

      const productDetailsPath = generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: product.id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        resetForm()
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_17836270312838hlfh44gw4i', {
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
        message: translate('text_1783627031283k41jtu4styo'),
      })
    },
  })

  const openDrawer = (product?: ProductForProductDrawerFragment) => {
    resetCreateMore()
    resetForm(product)

    drawer.open({
      title: product
        ? translate('text_1783627031283awv8tgambrd')
        : translate('text_1783622030703h5vhmp73muk'),
      form: { id: PRODUCT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: product ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="product-drawer-submit">
            {translate(product ? 'text_17295436903260tlyb1gp1i7' : 'text_1783627031283r77bfefzbi7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ProductDrawerContent
          form={form}
          isEdit={!!product}
          disableCodeInput={!!product?.attachedToPlanOrSubscription}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
