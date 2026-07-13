import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const PRODUCT_ITEM_FILTER_FORM_ID = 'product-item-filter-drawer-form'

export const PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID = 'product-item-filter-drawer-submit'

const PRODUCT_ITEM_FILTER_FORM_DEFAULTS = {}

const useProductItemFilterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const form = useAppForm({
    defaultValues: PRODUCT_ITEM_FILTER_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    onSubmit: async () => {
      // Replaced by the create/update item filter mutations when the form lands
      onSuccess()
    },
  })

  const resetForm = () => form.reset(PRODUCT_ITEM_FILTER_FORM_DEFAULTS, { keepDefaultValues: true })

  return { form, resetForm }
}

type ProductItemFilterForm = ReturnType<typeof useProductItemFilterForm>['form']

// Drawer body: `children` is captured once at open(), so reactive state added
// with the real form must live here; `form` is the data-passing seam.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProductItemFilterDrawerContent = ({ form: _form }: { form: ProductItemFilterForm }) => {
  return null
}

// Dual-mode drawer: `openDrawer()` with no argument creates an item filter; the
// edit flow will pass the item filter at open time and reset the form from it.
export const useProductItemFilterDrawer = () => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const { form, resetForm } = useProductItemFilterForm({
    onSuccess: () => drawer.close(),
  })

  const openDrawer = () => {
    resetForm()

    drawer.open({
      title: translate('text_17836220307039rf790f045t'),
      form: { id: PRODUCT_ITEM_FILTER_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={PRODUCT_ITEM_FILTER_DRAWER_SUBMIT_TEST_ID}>
            {translate('text_1742230191029lznwj3y41nb')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: <ProductItemFilterDrawerContent form={form} />,
    })
  }

  return { openDrawer }
}
