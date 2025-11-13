import {
  createFormHook,
  createFormHookContexts,
  formOptions,
  revalidateLogic,
  useStore,
} from '@tanstack/react-form'
import { AnySchema, array, object, string } from 'yup'

import { Button } from '~/components/designSystem/Button'
import { ComboBox, TextInput } from '~/components/form'
import { CurrencyEnum } from '~/generated/graphql'

const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts()

/**
 * Function that allows us to validate a form following a yup schema
 * @param schema yup schema
 * @param values values to validate
 * @returns undefined or error for the whole form or err for each field
 */
const validateFormFollowingWithSchema = (
  schema: AnySchema,
  values: unknown,
): undefined | { form: string } | { fields: Record<string, string> } => {
  try {
    schema.validateSync(values, { abortEarly: false })

    return undefined
  } catch (err) {
    const errors: Record<string, string> = {}

    if (!err || typeof err !== 'object' || !('inner' in err) || !Array.isArray(err.inner)) {
      return {
        form: err instanceof Error ? err.message : 'An unknown error occurred',
      }
    }

    err.inner.forEach((validationError) => {
      if (validationError.path) {
        errors[validationError.path] = validationError.message
      }
    })

    return {
      fields: errors,
    }
  }
}

const TextField = ({ label }: { label?: string }) => {
  const field = useFieldContext<string>()

  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <TextInput
      name={field.name}
      label={label}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      onBlur={field.handleBlur}
      error={errors.join('')}
    />
  )
}

const ComboBoxField = ({ label, data }: { label?: string; data: Array<{ value: string }> }) => {
  const field = useFieldContext<string>()

  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <ComboBox
      disableClearable
      label={label}
      data={data}
      onChange={(value) => field.handleChange(value)}
      value={field.state.value}
      error={errors.join('')}
    />
  )
}

const SubscribeButton = ({ label }: { label: string }) => {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        canSubmit: state.canSubmit,
      })}
    >
      {({ isSubmitting, canSubmit }) => (
        <div className="mt-4">
          <Button disabled={!canSubmit || isSubmitting} loading={isSubmitting} type="submit">
            {label}
          </Button>
        </div>
      )}
    </form.Subscribe>
  )
}

const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    ComboBoxField,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})

const FormTest = () => {
  const currencies = Object.values(CurrencyEnum).map((currency) => ({
    value: currency,
  }))

  const validationSchema = object({
    firstName: string().required('text_1726128938631ggtf2ggqs4b'),
    code: string().required('text_1726128938631ggtf2ggqs4b'),
    email: string()
      .email('text_1726128938631ggtf2ggqs4b')
      .required('text_1726128938631ggtf2ggqs4b'),
  })

  const validationForm2 = object({
    firstName: string().required('text_1726128938631ggtf2ggqs4b'),
    currency: string().required('text_1726128938631ggtf2ggqs4b'),
    hidden: string().required('text_1726128938631ggtf2ggqs4b'),
  })

  const validationForm3 = object({
    firstName: string().required('text_1726128938631ggtf2ggqs4b'),
    mapping: array().of(
      object({
        currency: string().required('text_1726128938631ggtf2ggqs4b'),
        amount: string().required('text_1726128938631ggtf2ggqs4b'),
      }).required('text_1726128938631ggtf2ggqs4b'),
    ),
  })

  const validationSchema4 = () => {
    return object({
      name: string()
        .test({
          test: function (value, { path }) {
            // Value is required
            if (!value) {
              return this.createError({
                path,
                message: 'text_1726128938631ggtf2ggqs4b',
              })
            }

            if (!value.startsWith('A')) {
              return this.createError({
                path,
                message: 'text_1726128938631ggtf2ggqs4b',
              })
            }

            return true
          },
        })
        .required('text_1726128938631ggtf2ggqs4b'),
      currency: string().required('text_1726128938631ggtf2ggqs4b'),
    })
  }

  const sendInformations = async (values: unknown) => {
    // eslint-disable-next-line no-console
    console.log('values', values)
  }

  const sharedFormOptions = formOptions({
    validationLogic: revalidateLogic(),
    onSubmit: async (values: { value: unknown }) => {
      // Only launched after validation
      await sendInformations(values.value)
    },
  })

  /**
   * FORM 1
   * Uses the handleChange on a text input to auto populate another field
   * Change on name will update code until code has been blurred
   */
  const form = useAppForm({
    ...sharedFormOptions,
    defaultValues: {
      firstName: '',
      code: '',
      email: '',
    },
    validators: {
      onDynamic: (values) => {
        const validation = validateFormFollowingWithSchema(validationSchema, values.value)

        return validation
      },
    },
  })

  const handleFirstNameChange = (value: string) => {
    const codeMeta = form.getFieldMeta('code')

    if (!codeMeta) {
      return
    }

    //Code hasn't been touched yet, auto fill it
    // Cannot used pristine or dirty since using setValue updates it
    if (!codeMeta.isBlurred) {
      form.setFieldValue('code', value.toLowerCase().replace(/\s+/g, '-'))
    }
  }

  /**
   * FORM 2
   * Uses validation to make field required based on another field value
   * Once currency changes, we update the value of hidden
   * Hidden is not displayed in the form but is required in the validation
   */
  const form2 = useAppForm({
    ...sharedFormOptions,
    defaultValues: {
      firstName: '',
      currency: '',
      hidden: '',
    },
    validators: {
      onDynamic: (values) => {
        return validateFormFollowingWithSchema(validationForm2, values.value)
      },
    },
  })

  const handleCurrencyChange = (value: string) => {
    // Update value with a logic. We could add a more complex one here
    form2.setFieldValue('hidden', `Hidden value for ${value}`)
  }

  /**
   * FORM 3
   * Uses async validation to simulate server side checks
   * Validates a dynamic array of values
   */
  const form3 = useAppForm({
    ...sharedFormOptions,
    defaultValues: {
      firstName: '',
      mapping: [] as Array<{ currency: string; amount: number }>,
    },
    validators: {
      onDynamicAsync: async (values) => {
        // eslint-disable-next-line no-console
        console.log('HERE 1')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // eslint-disable-next-line no-console
        console.log('HERE 2', values)
        const form3Validation = validateFormFollowingWithSchema(validationForm3, values.value)

        // eslint-disable-next-line no-console
        console.log('form3Validation', form3Validation)

        return form3Validation
      },
    },
  })

  // Better control of re render
  const alreadyUsedCurrencies = useStore(form3.store, (state) => {
    return state.values.mapping.map((m) => m.currency) || []
  })

  const availableCurrencies = currencies.map((c) => {
    return { value: c.value, disabled: alreadyUsedCurrencies.includes(c.value) }
  })

  const removeMapping = (index: number) => {
    form3.removeFieldValue('mapping', index)
  }

  const addMapping = () => {
    form3.pushFieldValue('mapping', { currency: '', amount: 0 })
  }

  /**
   * FORM 4
   * Uses validation to make field required based on another field value
   * Once currency changes, we update the value of hidden
   * Hidden is not displayed in the form but is required in the validation
   */
  const form4 = useAppForm({
    ...sharedFormOptions,
    defaultValues: {
      name: '',
      currency: '',
    },
    validators: {
      onDynamic: (values) => {
        return validateFormFollowingWithSchema(validationSchema4(), values.value)
      },
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const handleSubmitForm2 = (e: React.FormEvent) => {
    e.preventDefault()
    form2.handleSubmit()
  }

  const handleSubmitForm3 = (e: React.FormEvent) => {
    e.preventDefault()
    form3.handleSubmit()
  }
  const handleSubmitForm4 = (e: React.FormEvent) => {
    e.preventDefault()
    form4.handleSubmit()
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <div>
        <h2>Form Test 1</h2>
        <form onSubmit={handleSubmit}>
          <form.AppField
            name="firstName"
            listeners={{
              onChange: ({ fieldApi }) => handleFirstNameChange(fieldApi.state.value),
            }}
          >
            {(field) => <field.TextField label="First Name" />}
          </form.AppField>
          <form.AppField name="code">{(field) => <field.TextField label="Code" />}</form.AppField>
          <form.AppField name="email">
            {(field) => {
              return <field.TextField label="Email" />
            }}
          </form.AppField>
          <form.AppForm>
            <form.SubscribeButton label="Submit" />
          </form.AppForm>
        </form>
      </div>
      <div>
        <h2>Form Test 2</h2>
        <form onSubmit={handleSubmitForm2}>
          <form2.AppField name="firstName">
            {(field) => <field.TextField label="First Name" />}
          </form2.AppField>
          <form2.AppField
            name="currency"
            listeners={{
              onChange: ({ fieldApi }) => handleCurrencyChange(fieldApi.state.value),
            }}
          >
            {(field) => {
              return <field.ComboBoxField label="Currency" data={currencies} />
            }}
          </form2.AppField>
          <form2.AppForm>
            <form2.SubscribeButton label="Submit" />
          </form2.AppForm>
        </form>
      </div>
      <div>
        <h2>Form Test 3</h2>
        <form onSubmit={handleSubmitForm3}>
          <form3.AppField name="firstName">
            {(field) => <field.TextField label="First Name" />}
          </form3.AppField>
          <form3.AppField name="mapping" mode="array">
            {(field) => {
              return (
                <div className="flex flex-col gap-2">
                  {field.state.value.map((_, index) => {
                    return (
                      <div key={index} className="flex items-center justify-between gap-2">
                        <form3.AppField name={`mapping[${index}].currency`}>
                          {(subField) => (
                            <subField.ComboBoxField
                              label={index === 0 ? 'Currency' : undefined}
                              data={availableCurrencies}
                            />
                          )}
                        </form3.AppField>
                        <form3.AppField name={`mapping[${index}].amount`}>
                          {(subField) => (
                            <subField.TextField label={index === 0 ? 'Amount' : undefined} />
                          )}
                        </form3.AppField>
                        <Button type="button" danger onClick={() => removeMapping(index)}>
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                  <Button
                    type="button"
                    variant="inline"
                    align="left"
                    startIcon="plus"
                    onClick={addMapping}
                  >
                    Add Mapping
                  </Button>
                </div>
              )
            }}
          </form3.AppField>
          <form3.AppForm>
            <form3.SubscribeButton label="Submit" />
          </form3.AppForm>
        </form>
      </div>
      <div>
        <h2>Form Test 4</h2>
        <form onSubmit={handleSubmitForm4}>
          <form4.AppField name="name">
            {(field) => <field.TextField label="First Name" />}
          </form4.AppField>
          <form4.AppField name="currency">
            {(field) => {
              return <field.ComboBoxField label="Currency" data={currencies} />
            }}
          </form4.AppField>
          <form4.AppForm>
            <form4.SubscribeButton label="Submit" />
          </form4.AppForm>
        </form>
      </div>
    </div>
  )
}

export default FormTest
