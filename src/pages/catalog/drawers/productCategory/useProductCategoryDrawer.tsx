import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ProductCategoryDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { PRODUCT_CATEGORY_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import {
  LagoApiError,
  ProductCategoryForProductCategoryDrawerFragment,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { PRODUCT_FORM_DEFAULTS, PRODUCT_FORM_ID, ProductCategoryFormValues } from './constants'
import { ProductCategoryDrawerContent } from './ProductCategoryDrawerContent'

gql`
  fragment ProductCategoryForProductCategoryDrawer on ProductCategory {
    id
    name
    code
    description
    invoiceDisplayName
    attachedToPlanOrSubscription
  }

  mutation createProductCategory($input: CreateProductCategoryInput!) {
    createProductCategory(input: $input) {
      id
      ...ProductCategoryForProductCategoryDrawer
    }
  }

  mutation updateProductCategory($input: UpdateProductCategoryInput!) {
    updateProductCategory(input: $input) {
      id
      ...ProductCategoryForProductCategoryDrawer
    }
  }
`

const productCategoryDrawerSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  description: z.string(),
  invoiceDisplayName: z.string(),
})

const mapProductCategoryToFormValues = (
  productCategory: ProductCategoryForProductCategoryDrawerFragment,
): ProductCategoryFormValues => ({
  name: productCategory.name,
  code: productCategory.code,
  description: productCategory.description || '',
  invoiceDisplayName: productCategory.invoiceDisplayName || '',
})

// `data-text` is a double-quoted HTML attribute in the linked-toast template;
// escape embedded quotes so a productCategory name cannot break out of the attribute.
const escapeDoubleQuotes = (value: string) => value.replaceAll('"', '&quot;')

type ProductCategoryFormSuccess = {
  productCategory: ProductCategoryForProductCategoryDrawerFragment
  wasEdit: boolean
}

const useProductCategoryForm = ({
  onSuccess,
}: {
  onSuccess: (result: ProductCategoryFormSuccess) => void
}) => {
  const editedProductCategoryRef = useRef<
    ProductCategoryForProductCategoryDrawerFragment | undefined
  >(undefined)

  const [createProductCategory] = useCreateProductCategoryMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['productCategories'],
  })
  const [updateProductCategory] = useUpdateProductCategoryMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productCategoryDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProductCategory = editedProductCategoryRef.current

      let productCategory: ProductCategoryForProductCategoryDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); create omits them.
      if (editedProductCategory) {
        const result = await updateProductCategory({
          variables: {
            input: {
              id: editedProductCategory.id,
              name: value.name,
              code: value.code,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
            },
          },
        })

        productCategory = result.data?.updateProductCategory
        errors = result.errors
      } else {
        const result = await createProductCategory({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        productCategory = result.data?.createProductCategory
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (productCategory) {
        onSuccess({ productCategory, wasEdit: !!editedProductCategory })
      }
    },
  })

  const resetForm = (productCategory?: ProductCategoryForProductCategoryDrawerFragment) => {
    editedProductCategoryRef.current = productCategory
    form.reset(
      productCategory ? mapProductCategoryToFormValues(productCategory) : PRODUCT_FORM_DEFAULTS,
      {
        keepDefaultValues: true,
      },
    )
  }

  return { form, resetForm }
}

// Dual-mode drawer: `openDrawer()` with no argument creates a productCategory;
// `openDrawer(productCategory)` edits it. Create mode carries the "Create more" footer
// toggle that keeps the drawer open, resets the form, and links the new productCategory
// in the success toast.
export const useProductCategoryDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const { form, resetForm } = useProductCategoryForm({
    onSuccess: ({ productCategory, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1783627031283gttzuphzl2o'),
        })
        return
      }

      const productCategoryDetailsPath = generatePath(PRODUCT_CATEGORY_DETAILS_ROUTE, {
        productCategoryId: productCategory.id,
        tab: ProductCategoryDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        resetForm()
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_17836270312838hlfh44gw4i', {
            productCategoryName: escapeDoubleQuotes(productCategory.name),
            productCategoryUrl: prependOrgSlug(productCategoryDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(productCategoryDetailsPath)
      addToast({
        severity: 'success',
        message: translate('text_1783627031283k41jtu4styo'),
      })
    },
  })

  const openDrawer = (productCategory?: ProductCategoryForProductCategoryDrawerFragment) => {
    resetCreateMore()
    resetForm(productCategory)

    drawer.open({
      title: productCategory
        ? translate('text_1783627031283awv8tgambrd')
        : translate('text_1783622030703h5vhmp73muk'),
      form: { id: PRODUCT_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: productCategory ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="product-drawer-submit">
            {translate(
              productCategory ? 'text_17295436903260tlyb1gp1i7' : 'text_1783627031283r77bfefzbi7',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ProductCategoryDrawerContent
          form={form}
          isEdit={!!productCategory}
          disableCodeInput={!!productCategory?.attachedToPlanOrSubscription}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
