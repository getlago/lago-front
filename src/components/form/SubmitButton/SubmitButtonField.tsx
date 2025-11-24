import { Button, ButtonProps } from '~/components/designSystem'
import { useFormContext } from '~/hooks/forms/formContext'

const SubmitButtonField = ({
  children,
  size,
  variant,
  dataTest,
}: ButtonProps & { dataTest?: string }) => {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        canSubmit: state.canSubmit,
        isDirty: state.isDirty,
        isValid: state.isValid,
      })}
    >
      {({ isSubmitting, canSubmit, isDirty, isValid }) => (
        <Button
          size={size}
          variant={variant}
          disabled={!canSubmit || isSubmitting || !isDirty || !isValid}
          loading={isSubmitting}
          type="submit"
          data-test={dataTest}
        >
          {children}
        </Button>
      )}
    </form.Subscribe>
  )
}

export default SubmitButtonField
