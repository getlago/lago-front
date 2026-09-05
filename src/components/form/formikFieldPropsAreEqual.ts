import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

type FormikFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
}

// `memo` comparator shared by the Formik field wrappers: re-render only when
// this field's own value, error or touched flag changes, not on every keystroke
// elsewhere in the form.
export const formikFieldPropsAreEqual = <T extends FormikFieldProps>(
  { formikProps: prevFormikProps, name: prevName, ...prev }: T,
  { formikProps: nextformikProps, name: nextName, ...next }: T,
): boolean =>
  _isEqual(prev, next) &&
  prevName === nextName &&
  _get(prevFormikProps.values, prevName) === _get(nextformikProps.values, nextName) &&
  _get(prevFormikProps.errors, prevName) === _get(nextformikProps.errors, nextName) &&
  _get(prevFormikProps.touched, prevName) === _get(nextformikProps.touched, nextName)
