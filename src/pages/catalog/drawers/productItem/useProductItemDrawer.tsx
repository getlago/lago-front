import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import { z } from 'zod'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ProductItemDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { PRODUCT_ITEM_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import {
  LagoApiError,
  ProductItemForDrawerFragment,
  ProductItemTypeEnum,
  useCreateProductItemMutation,
  useUpdateProductItemMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID,
  PRODUCT_ITEM_FORM_DEFAULTS,
  PRODUCT_ITEM_FORM_ID,
  ProductItemFormValues,
} from './constants'
import { ComboboxSeed, ProductItemDrawerContent } from './ProductItemDrawerContent'

gql`
  fragment ProductItemForDrawer on ProductItem {
    id
    name
    code
    description
    invoiceDisplayName
    itemType
    attachedToPlanOrSubscription
    product {
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

  mutation createProductItem($input: CreateProductItemInput!) {
    createProductItem(input: $input) {
      id
      ...ProductItemForDrawer
    }
  }

  mutation updateProductItem($input: UpdateProductItemInput!) {
    updateProductItem(input: $input) {
      id
      ...ProductItemForDrawer
    }
  }
`

const productItemDrawerSchema = z
  .object({
    name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    description: z.string(),
    invoiceDisplayName: z.string(),
    productId: z.string(),
    itemType: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
    billableMetricId: z.string(),
  })
  .superRefine((values, ctx) => {
    // A usage item bills against a billable metric; the API leaves it optional
    // so the requirement is enforced here.
    if (values.itemType === ProductItemTypeEnum.Usage && !values.billableMetricId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billableMetricId'],
        message: 'text_624ea7c29103fd010732ab7d',
      })
    }
  })

const mapProductItemToFormValues = (
  productItem: ProductItemForDrawerFragment,
): ProductItemFormValues => ({
  name: productItem.name,
  code: productItem.code,
  description: productItem.description || '',
  invoiceDisplayName: productItem.invoiceDisplayName || '',
  productId: productItem.product?.id || '',
  itemType: productItem.itemType,
  billableMetricId: productItem.billableMetric?.id || '',
})

// `data-text` is a double-quoted HTML attribute in the linked-toast template;
// escape embedded quotes so a product item name cannot break out of it.
const escapeDoubleQuotes = (value: string) => value.replaceAll('"', '&quot;')

type ProductAttachment = { id: string; name: string; code: string }

type ProductItemFormSuccess = {
  productItem: ProductItemForDrawerFragment
  wasEdit: boolean
}

const useProductItemForm = ({
  onSuccess,
}: {
  onSuccess: (result: ProductItemFormSuccess) => void
}) => {
  const editedProductItemRef = useRef<ProductItemForDrawerFragment | undefined>(undefined)

  const [createProductItem] = useCreateProductItemMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['productItems'],
  })
  const [updateProductItem] = useUpdateProductItemMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: productItemDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedProductItem = editedProductItemRef.current

      let productItem: ProductItemForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); itemType, product
      // and billable metric are create-only, so they are not sent on update.
      if (editedProductItem) {
        const result = await updateProductItem({
          variables: {
            input: {
              id: editedProductItem.id,
              name: value.name,
              code: value.code,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
            },
          },
        })

        productItem = result.data?.updateProductItem
        errors = result.errors
      } else {
        const result = await createProductItem({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              itemType: value.itemType as ProductItemTypeEnum,
              productId: value.productId || undefined,
              billableMetricId:
                value.itemType === ProductItemTypeEnum.Usage
                  ? value.billableMetricId || undefined
                  : undefined,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        productItem = result.data?.createProductItem
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (productItem) {
        onSuccess({ productItem, wasEdit: !!editedProductItem })
      }
    },
  })

  const resetForm = (
    productItem?: ProductItemForDrawerFragment,
    attachToProduct?: ProductAttachment,
  ) => {
    editedProductItemRef.current = productItem

    if (productItem) {
      form.reset(mapProductItemToFormValues(productItem), { keepDefaultValues: true })
      return
    }

    form.reset(
      attachToProduct
        ? { ...PRODUCT_ITEM_FORM_DEFAULTS, productId: attachToProduct.id }
        : PRODUCT_ITEM_FORM_DEFAULTS,
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

type OpenProductItemDrawerArgs = {
  productItem?: ProductItemForDrawerFragment
  attachToProduct?: ProductAttachment
}

// Dual-mode drawer: `openDrawer()` creates a product item, `openDrawer({ productItem })`
// edits it, and `openDrawer({ attachToProduct })` (used from the product details tab)
// prefills the attached product. Create mode carries the "Create more" footer toggle
// that keeps the drawer open, resets the form, and links the new item in the toast.
export const useProductItemDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const { form, resetForm } = useProductItemForm({
    onSuccess: ({ productItem, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate('text_1783980718114jtotg0hluib'),
        })
        return
      }

      const productItemDetailsPath = generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
        productItemId: productItem.id,
        tab: ProductItemDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        resetForm()
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1783980718114wpjktwhgw5c', {
            productItemName: escapeDoubleQuotes(productItem.name),
            productItemUrl: prependOrgSlug(productItemDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(productItemDetailsPath)
      addToast({
        severity: 'success',
        message: translate('text_1783980718113u0nftkjemj1'),
      })
    },
  })

  const openDrawer = ({ productItem, attachToProduct }: OpenProductItemDrawerArgs = {}) => {
    resetCreateMore()
    resetForm(productItem, attachToProduct)

    const productSource = productItem?.product ?? attachToProduct
    const productSeed: ComboboxSeed = productSource
      ? { value: productSource.id, label: productSource.name }
      : null
    const billableMetricSeed: ComboboxSeed = productItem?.billableMetric
      ? { value: productItem.billableMetric.id, label: productItem.billableMetric.name }
      : null

    drawer.open({
      title: productItem
        ? translate('text_1783980718113x99ykq6zvpi')
        : translate('text_1783622030703m9jlurg4jsn'),
      form: { id: PRODUCT_ITEM_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: productItem ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID}>
            {translate(
              productItem ? 'text_17295436903260tlyb1gp1i7' : 'text_1783980718113c63agwciyi5',
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <ProductItemDrawerContent
          form={form}
          isEdit={!!productItem}
          disableCodeInput={!!productItem?.attachedToPlanOrSubscription}
          productSeed={productSeed}
          billableMetricSeed={billableMetricSeed}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
