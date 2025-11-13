import { yupResolver } from '@hookform/resolvers/yup'
import { FieldValues, useController, UseControllerProps, useForm } from 'react-hook-form'
import { array, object, string } from 'yup'

import { Button } from '~/components/designSystem/Button'
import { ComboBox, TextInput } from '~/components/form'
import { CurrencyEnum } from '~/generated/graphql'

function TextField<FormInputType extends FieldValues>(
  props: UseControllerProps<FormInputType> & {
    label: string
    handleChange?: (
      field: ReturnType<typeof useController<FormInputType>>['field'],
      value: string,
    ) => void
  },
) {
  const { field, fieldState } = useController(props)

  const customHandleChange = (value: string) => {
    if (props.handleChange) {
      props.handleChange(field, value)
    } else {
      field.onChange(value)
    }
  }

  return (
    <TextInput
      name={field.name}
      label={props.label}
      value={field.value}
      onChange={(value) => customHandleChange(value)}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )
}

function ComboBoxField<FormInputType extends FieldValues>(
  props: UseControllerProps<FormInputType> & {
    label: string
    data: Array<{ value: string }>
    handleChange?: (
      field: ReturnType<typeof useController<FormInputType>>['field'],
      value: string,
    ) => void
  },
) {
  const { field, fieldState } = useController(props)

  const customHandleChange = (value: string) => {
    if (props.handleChange) {
      props.handleChange(field, value)
    } else {
      field.onChange(value)
    }
  }

  return (
    <ComboBox
      disableClearable
      label={props.label}
      data={props.data}
      onChange={(value) => customHandleChange(value)}
      value={field.value}
      error={fieldState.error?.message}
    />
  )
}

type FormValues = {
  name: string
  code: string
  email: string
}

type Form2Values = {
  name: string
  currency: string
  hidden: string
}

type Form3Values = {
  name: string
  mapping: Array<{
    currency: string
    amount: string
  }>
}

type Form4Values = {
  name: string
  currency: string
}

const FormTestReactHook = () => {
  const currencies = Object.values(CurrencyEnum).map((currency) => ({
    value: currency,
  }))

  const validationSchema = object({
    name: string().required('text_1726128938631ggtf2ggqs4b'),
    code: string().required('text_1726128938631ggtf2ggqs4b'),
    email: string()
      .email('text_1726128938631ggtf2ggqs4b')
      .required('text_1726128938631ggtf2ggqs4b'),
  })

  const validationSchema2 = object({
    name: string().required('text_1726128938631ggtf2ggqs4b'),
    hidden: string().required('text_1726128938631ggtf2ggqs4b'),
    currency: string().required('text_1726128938631ggtf2ggqs4b'),
  })

  const validationSchema3 = object({
    name: string().required('text_1726128938631ggtf2ggqs4b'),
    mapping: array()
      .of(
        object({
          currency: string().required('text_1726128938631ggtf2ggqs4b'),
          amount: string().required('text_1726128938631ggtf2ggqs4b'),
        }),
      )
      .required('text_1726128938631ggtf2ggqs4b'),
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

  const onSubmit = (data: FormValues | Form2Values | Form3Values | Form4Values) => {
    // Only launched after validation
    // eslint-disable-next-line no-console
    console.log('data', data)
  }

  /**
   * FORM 1
   * Uses the handleChange on a text input to auto populate another field
   * Change on name will update code until code has been blurred
   */
  const { handleSubmit, control, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      code: '',
      email: '',
    },
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
  })

  const handleNameChange = (
    field: ReturnType<typeof useController<FormValues>>['field'],
    value: string,
  ) => {
    const isDirty = control.getFieldState('code').isDirty

    // isDirty = has been updated by the user
    if (!isDirty) {
      setValue('code', value.toLowerCase().replace(/\s+/g, '-'))
    }

    field.onChange(value)
  }

  /**
   * FORM 2
   * Uses validation to make field required based on another field value
   * Once currency changes, we update the value of hidden
   * Hidden is not displayed in the form but is required in the validation
   */
  const {
    handleSubmit: handleSubmit2,
    control: control2,
    setValue: setValue2,
  } = useForm<Form2Values>({
    defaultValues: {
      name: '',
      hidden: '',
      currency: '',
    },
    resolver: yupResolver(validationSchema2),
    mode: 'onChange',
  })

  const handleCurrencyChange = (
    field: ReturnType<typeof useController<Form2Values>>['field'],
    value: string,
  ) => {
    // Update value with a logic. We could add a more complex one here
    setValue2('hidden', `Hidden value for ${value}`)
    field.onChange(value)
  }

  /**
   * FORM 3
   *Uses async validation to simulate server side checks
   * Validates a dynamic array of values
   */
  const {
    handleSubmit: handleSubmit3,
    control: control3,
    setValue: setValue3,
    watch,
  } = useForm<Form3Values>({
    defaultValues: {
      name: '',
      mapping: [],
    },
    resolver: yupResolver(validationSchema3),
    mode: 'onChange',
  })

  const formValues = watch()

  const availableCurrencies = currencies.map((c) => {
    const alreadyUsedCurrencies = formValues.mapping?.map((m) => m.currency) || []

    return {
      value: c.value,
      disabled: alreadyUsedCurrencies.includes(c.value),
    }
  })

  const addMapping = () => {
    const currentValues = formValues.mapping || []

    setValue3('mapping', [...currentValues, { currency: '', amount: '' }])
  }

  const removeMapping = (index: number) => {
    const currentValues = formValues.mapping || []

    const newValues = currentValues.filter((_, i) => i !== index)

    setValue3('mapping', newValues)
  }

  /**
   * FORM 4
   * Uses validation in the form of a function
   */
  const { handleSubmit: handleSubmit4, control: control4 } = useForm<Form4Values>({
    defaultValues: {
      name: '',
      currency: '',
    },
    resolver: yupResolver(validationSchema4()),
    mode: 'onChange',
  })

  return (
    <div className="m-4 flex flex-col gap-4">
      <div>
        <h2>Form Test 1</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField name="name" control={control} label="Name" handleChange={handleNameChange} />
          <TextField name="code" control={control} label="Code" />
          <TextField name="email" control={control} label="Email" />
          <Button type="submit" className="mt-4">
            Submit
          </Button>
        </form>
      </div>

      <div>
        <h2>Form Test 2</h2>
        <form onSubmit={handleSubmit2(onSubmit)}>
          <TextField name="name" control={control2} label="Name" />
          <ComboBoxField
            name="currency"
            control={control2}
            label="Currency"
            data={currencies}
            handleChange={handleCurrencyChange}
          />
          <Button type="submit" className="mt-4">
            Submit
          </Button>
        </form>
      </div>

      <div>
        <h2>Form Test 3</h2>
        <form onSubmit={handleSubmit3(onSubmit)}>
          <TextField name="name" control={control3} label="Name" />
          {/* Dynamic array of values */}
          <div className="flex flex-col gap-2">
            {(formValues.mapping || []).map((_, index) => {
              return (
                <div key={index} className="flex items-center justify-between gap-2">
                  <ComboBoxField
                    name={`mapping.${index}.currency`}
                    control={control3}
                    label="Currency"
                    data={availableCurrencies}
                  />
                  <TextField name={`mapping.${index}.amount`} control={control3} label="Amount" />
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
              onClick={() => addMapping()}
            >
              Add Mapping
            </Button>
          </div>
          <Button type="submit" className="mt-4">
            Submit
          </Button>
        </form>
      </div>

      <div>
        <h2>Form Test 4</h2>
        <form onSubmit={handleSubmit4(onSubmit)}>
          <TextField name="name" control={control4} label="Name" />
          <ComboBoxField name="currency" control={control4} label="Currency" data={currencies} />
          <Button type="submit" className="mt-4">
            Submit
          </Button>
        </form>
      </div>
    </div>
  )
}

export default FormTestReactHook
