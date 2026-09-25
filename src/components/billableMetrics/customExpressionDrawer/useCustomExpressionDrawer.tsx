import { revalidateLogic } from '@tanstack/react-form'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  CustomExpressionDrawerActions,
  useSetValidationResultRef,
} from './CustomExpressionDrawerActions'
import { CustomExpressionDrawerContent } from './CustomExpressionDrawerContent'
import {
  buildCustomExpressionDefaultValues,
  CUSTOM_EXPRESSION_DEFAULT_VALUES,
  customExpressionValidationSchema,
} from './validationSchema'

const CUSTOM_EXPRESSION_FORM_ID = 'custom-expression-drawer-form'

export type OpenCustomExpressionDrawerParams = {
  expression?: string | null
  billableMetricCode?: string | null
  isEditable?: boolean
}

type UseCustomExpressionDrawerProps = {
  onSave: (expression: string) => void
}

type UseCustomExpressionDrawerReturn = {
  openDrawer: (params?: OpenCustomExpressionDrawerParams) => void
}

export const useCustomExpressionDrawer = ({
  onSave,
}: UseCustomExpressionDrawerProps): UseCustomExpressionDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const setValidationResultRef = useSetValidationResultRef()

  const form = useAppForm({
    defaultValues: CUSTOM_EXPRESSION_DEFAULT_VALUES,
    validationLogic: revalidateLogic({ mode: 'blur' }),
    validators: {
      onDynamic: customExpressionValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value.expression)

      drawer.close()
    },
  })

  const openDrawer = ({
    expression,
    billableMetricCode,
    isEditable = false,
  }: OpenCustomExpressionDrawerParams = {}): void => {
    const defaultValues = buildCustomExpressionDefaultValues(billableMetricCode)

    // `keepDefaultValues` pins the form's defaults to the module constant: a
    // re-render of the consumer would otherwise hand `useAppForm` a fresh
    // object and wipe the seeded expression.
    form.reset(
      { ...defaultValues, expression: expression || defaultValues.expression },
      { keepDefaultValues: true },
    )

    drawer.open({
      title: translate('text_1729771640162lug0w6ztlyr'),
      form: { id: CUSTOM_EXPRESSION_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onClose: () => form.reset(),
      children: (
        <CustomExpressionDrawerContent
          form={form}
          isEditable={isEditable}
          setValidationResultRef={setValidationResultRef}
        />
      ),
      mainAction: (
        <CustomExpressionDrawerActions
          form={form}
          isEditable={isEditable}
          setValidationResultRef={setValidationResultRef}
        />
      ),
    })
  }

  return { openDrawer }
}
