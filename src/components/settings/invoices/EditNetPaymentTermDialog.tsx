import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  NET_PAYMENT_TERM_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { NetPaymentTermValuesEnum } from '~/core/constants/paymentTerm'
import {
  EditBillingEntityNetPaymentTermForDialogFragment,
  EditCustomerNetPaymentTermForDialogFragment,
  useUpdateBillingEntityNetPaymentTermMutation,
  useUpdateCustomerNetPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

export const EDIT_NET_PAYMENT_TERM_FORM_ID = 'edit-net-payment-term-form'

gql`
  fragment EditCustomerNetPaymentTermForDialog on Customer {
    id
    externalId
    name
    netPaymentTerm
  }

  fragment EditBillingEntityNetPaymentTermForDialog on BillingEntity {
    id
    netPaymentTerm
  }

  mutation updateCustomerNetPaymentTerm($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerNetPaymentTermForDialog
    }
  }

  mutation updateBillingEntityNetPaymentTerm($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityNetPaymentTermForDialog
    }
  }
`

enum NetPaymentTermModelTypesEnum {
  Customer = 'Customer',
  BillingEntity = 'BillingEntity',
}

type FormValues = {
  netPaymentTerm: string
  customPeriod: number | ''
}

const initialValues: FormValues = {
  netPaymentTerm: '',
  customPeriod: '',
}

const validationSchema = z
  .object({
    netPaymentTerm: z.enum(NetPaymentTermValuesEnum),
    customPeriod: z.union([z.number(), z.literal('')]),
  })
  .refine(
    (data) =>
      data.netPaymentTerm !== NetPaymentTermValuesEnum.custom ||
      (typeof data.customPeriod === 'number' && data.customPeriod >= 0),
    { path: ['customPeriod'], message: '' },
  )

type ModelData =
  EditCustomerNetPaymentTermForDialogFragment | EditBillingEntityNetPaymentTermForDialogFragment

const getInitialFormValues = (model: ModelData | null): FormValues => {
  if (!model || typeof model.netPaymentTerm !== 'number') {
    return initialValues
  }

  const isCustomValue = !Object.values(NetPaymentTermValuesEnum).includes(
    String(model.netPaymentTerm) as unknown as NetPaymentTermValuesEnum,
  )

  return {
    netPaymentTerm: isCustomValue ? NetPaymentTermValuesEnum.custom : String(model.netPaymentTerm),
    customPeriod: isCustomValue ? model.netPaymentTerm : '',
  }
}

const DialogContent = withForm({
  defaultValues: initialValues,
  render: function Render({ form }) {
    const { translate } = useInternationalization()
    const netPaymentTerm = useStore(form.store, (state) => state.values.netPaymentTerm)

    return (
      <div className="flex flex-col gap-3 p-8">
        <form.AppField name="netPaymentTerm">
          {(field) => (
            <field.ComboBoxField
              className={NET_PAYMENT_TERM_INPUT_CLASSNAME}
              label={translate('text_64c7a89b6c67eb6c98898109')}
              placeholder={translate('text_64c7b3014f5c4639c4a51ab0')}
              sortValues={false}
              data={[
                {
                  value: NetPaymentTermValuesEnum.zero,
                  label: translate('text_64c7a89b6c67eb6c98898125'),
                },
                {
                  value: NetPaymentTermValuesEnum.thirty,
                  label: translate(
                    'text_64c7a89b6c67eb6c9889815f',
                    {
                      days: 30,
                    },
                    30,
                  ),
                },
                {
                  value: NetPaymentTermValuesEnum.sixty,
                  label: translate(
                    'text_64c7a89b6c67eb6c9889815f',
                    {
                      days: 60,
                    },
                    60,
                  ),
                },
                {
                  value: NetPaymentTermValuesEnum.ninety,
                  label: translate(
                    'text_64c7a89b6c67eb6c9889815f',
                    {
                      days: 90,
                    },
                    90,
                  ),
                },
                {
                  value: NetPaymentTermValuesEnum.custom,
                  label: translate('text_64c7a89b6c67eb6c988981ae'),
                },
              ]}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </form.AppField>

        {netPaymentTerm === NetPaymentTermValuesEnum.custom && (
          <form.AppField name="customPeriod">
            {(field) => (
              <field.TextInputField
                label={translate('text_64c7a89b6c67eb6c988981ae')}
                placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
                beforeChangeFormatter={['positiveNumber', 'int']}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {translate('text_638dc196fb209d551f3d814d')}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </form.AppField>
        )}
      </div>
    )
  },
})

type EditNetPaymentTermDialogData = {
  model: ModelData | null | undefined
  description: string
}

export const useEditNetPaymentTermDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const modelRef = useRef<ModelData | null>(null)
  const isEditRef = useRef(false)
  const successRef = useRef(false)

  const [updateBillingEntity] = useUpdateBillingEntityNetPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: isEditRef.current
            ? 'text_64c7a89b6c67eb6c98898181'
            : 'text_64c7a89b6c67eb6c98898350',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })
  const [updateCustomer] = useUpdateCustomerNetPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateCustomer) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: isEditRef.current
            ? 'text_64c7a89b6c67eb6c98898181'
            : 'text_64c7a89b6c67eb6c98898350',
        })
      }
    },
  })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value }) => {
      const model = modelRef.current

      if (!model) return

      const localInput = {
        netPaymentTerm:
          value.netPaymentTerm === NetPaymentTermValuesEnum.custom
            ? Number(value.customPeriod)
            : Number(value.netPaymentTerm),
      }

      if (model.__typename === NetPaymentTermModelTypesEnum.Customer) {
        await updateCustomer({
          variables: {
            input: {
              id: model.id,
              externalId: model.externalId,
              name: model.name || '',
              ...localInput,
            },
          },
        })
      } else if (model.__typename === NetPaymentTermModelTypesEnum.BillingEntity) {
        await updateBillingEntity({
          variables: {
            input: {
              ...localInput,
              id: model.id,
            },
          },
        })
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openEditNetPaymentTermDialog = ({ model, description }: EditNetPaymentTermDialogData) => {
    modelRef.current = model ?? null
    isEditRef.current = typeof model?.netPaymentTerm === 'number'

    const seeded = getInitialFormValues(model ?? null)

    form.reset()
    form.setFieldValue('netPaymentTerm', seeded.netPaymentTerm)
    form.setFieldValue('customPeriod', seeded.customPeriod)

    formDialog
      .open({
        title: translate(
          isEditRef.current ? 'text_64c7a89b6c67eb6c988981e0' : 'text_64c7a89b6c67eb6c9889822d',
        ),
        description,
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${NET_PAYMENT_TERM_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: <DialogContent form={form} />,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17432414198706rdwf76ek3u')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_NET_PAYMENT_TERM_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          modelRef.current = null
          isEditRef.current = false
        }
      })
  }

  return { openEditNetPaymentTermDialog }
}
