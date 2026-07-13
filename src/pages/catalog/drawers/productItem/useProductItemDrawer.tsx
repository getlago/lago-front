import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const PRODUCT_ITEM_FORM_ID = 'product-item-drawer-form'

export const PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID = 'product-item-drawer-submit'

const PRODUCT_ITEM_FORM_DEFAULTS = {}

const useProductItemForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    onSubmit: async () => {
      // Replaced by the create/update product item mutations when the form lands
      onSuccess()
    },
  })

  const resetForm = () => form.reset(PRODUCT_ITEM_FORM_DEFAULTS, { keepDefaultValues: true })

  return { form, resetForm }
}

type ProductItemForm = ReturnType<typeof useProductItemForm>['form']

// Drawer body: `children` is captured once at open(), so reactive state added
// with the real form must live here; `form` is the data-passing seam.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProductItemDrawerContent = ({ form: _form }: { form: ProductItemForm }) => {
  return null
}

// Dual-mode drawer: `openDrawer()` with no argument creates a product item; the
// edit flow will pass the product item at open time and reset the form from it.
export const useProductItemDrawer = () => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const { form, resetForm } = useProductItemForm({
    onSuccess: () => drawer.close(),
  })

  const openDrawer = () => {
    resetForm()

    drawer.open({
      title: translate('text_1783622030703m9jlurg4jsn'),
      form: { id: PRODUCT_ITEM_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={PRODUCT_ITEM_DRAWER_SUBMIT_TEST_ID}>
            {translate('text_1742230191029lznwj3y41nb')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: <ProductItemDrawerContent form={form} />,
    })
  }

  return { openDrawer }
}
