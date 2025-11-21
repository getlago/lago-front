import { createFormHook } from '@tanstack/react-form'
import { Spinner } from 'lago-design-system'
import { ComponentType, lazy, Suspense } from 'react'

import { fieldContext, formContext } from './formContext.ts'

const CheckboxFieldLazy = lazy(
  () => import('~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'),
)
const ComboBoxFieldLazy = lazy(
  () => import('~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'),
)
const SubmitButtonLazy = lazy(() => import('~/components/form/SubmitButton/SubmitButtonField.tsx'))
const SwitchFieldLazy = lazy(() => import('~/components/form/Switch/SwitchFieldForTanstack.tsx'))
const TextInputFieldLazy = lazy(
  () => import('~/components/form/TextInput/TextInputFieldForTanstack.tsx'),
)

const withLazySuspense = <T extends Record<string, unknown>>(
  LazyComponent: ComponentType<T>,
): ComponentType<T> => {
  const WrappedComponent = (props: T) => (
    <Suspense fallback={<Spinner />}>
      <LazyComponent {...props} />
    </Suspense>
  )

  return WrappedComponent
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextInputField: withLazySuspense(TextInputFieldLazy),
    ComboBoxField: withLazySuspense(ComboBoxFieldLazy),
    SwitchField: withLazySuspense(SwitchFieldLazy),
    CheckboxField: withLazySuspense(CheckboxFieldLazy),
  },
  formComponents: {
    SubmitButton: withLazySuspense(SubmitButtonLazy),
  },
  fieldContext,
  formContext,
})
