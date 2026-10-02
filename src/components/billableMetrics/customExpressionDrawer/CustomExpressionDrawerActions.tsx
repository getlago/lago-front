import { useStore } from '@tanstack/react-form'
import { MutableRefObject, useRef, useState } from 'react'

import { ValidationResult, wrappedEvaluateExpression } from '~/components/billableMetrics/utils'
import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import {
  CUSTOM_EXPRESSION_DEFAULT_VALUES,
  customExpressionValidationSchema,
} from './validationSchema'

export type SetValidationResultRef = MutableRefObject<(result: ValidationResult) => void>

export const useSetValidationResultRef = (): SetValidationResultRef =>
  useRef<(result: ValidationResult) => void>(() => {})

export const CUSTOM_EXPRESSION_VALIDATE_TEST_ID = 'custom-expression-drawer-validate'
export const CUSTOM_EXPRESSION_SAVE_TEST_ID = 'custom-expression-drawer-save'

type CustomExpressionDrawerActionsProps = {
  isEditable: boolean
  setValidationResultRef: SetValidationResultRef
}

const defaultProps: CustomExpressionDrawerActionsProps = {
  isEditable: false,
  setValidationResultRef: { current: () => {} },
}

export const CustomExpressionDrawerActions = withForm({
  defaultValues: CUSTOM_EXPRESSION_DEFAULT_VALUES,
  props: defaultProps,
  render: function CustomExpressionDrawerActionsRender({
    form,
    isEditable,
    setValidationResultRef,
  }) {
    const { translate } = useInternationalization()
    const [validationResult, setValidationResult] = useState<ValidationResult>()

    // `revalidateLogic` only fills the error map once a field changes, so the
    // gate reads the schema directly to stay closed on an untouched form.
    const hasErrors = useStore(
      form.store,
      (state) => !customExpressionValidationSchema.safeParse(state.values).success,
    )

    const onValidateExpression = (): void => {
      const { expression, eventPayload } = form.state.values
      const result = wrappedEvaluateExpression(expression, eventPayload, translate)

      setValidationResult(result)
      setValidationResultRef.current(result)
    }

    return (
      <>
        <Button
          variant="secondary"
          onClick={onValidateExpression}
          disabled={hasErrors}
          data-test={CUSTOM_EXPRESSION_VALIDATE_TEST_ID}
        >
          {translate('text_1729773655417m826qhyr465')}
        </Button>

        {isEditable && (
          <form.AppForm>
            <form.SubmitButton
              disabled={!validationResult?.result}
              dataTest={CUSTOM_EXPRESSION_SAVE_TEST_ID}
            >
              {translate('text_17297736554176g6clgo34du')}
            </form.SubmitButton>
          </form.AppForm>
        )}
      </>
    )
  },
})
