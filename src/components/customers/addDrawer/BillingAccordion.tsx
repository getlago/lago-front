import { FormikProps } from 'formik'
import { FC, useEffect, useState } from 'react'

import { Accordion, Typography } from '~/components/designSystem'
import { Checkbox, ComboBoxField, ComboBoxProps, TextInputField } from '~/components/form'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import {
  AddCustomerDrawerFragment,
  CreateCustomerInput,
  CurrencyEnum,
  CustomerAddress,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const billingFields: Array<
  { name: keyof CustomerAddress; label?: string; placeholder?: string } & (
    | {
        type: 'text'
      }
    | {
        type: 'combobox'
        data: ComboBoxProps['data']
      }
  )
> = [
  {
    name: 'addressLine1',
    type: 'text',
    label: 'text_626c0c09812bbc00e4c59e1b',
    placeholder: 'text_626c0c09812bbc00e4c59e1d',
  },
  {
    name: 'addressLine2',
    type: 'text',
    placeholder: 'text_626c0c09812bbc00e4c59e1f',
  },
  {
    name: 'zipcode',
    type: 'text',
    placeholder: 'text_626c0c09812bbc00e4c59e21',
  },
  {
    name: 'city',
    type: 'text',
    placeholder: 'text_626c0c09812bbc00e4c59e23',
  },
  {
    name: 'state',
    type: 'text',
    placeholder: 'text_626c0c09812bbc00e4c59e25',
  },
  {
    name: 'country',
    type: 'combobox',
    placeholder: 'text_626c0c09812bbc00e4c59e27',
    data: countryDataForCombobox,
  },
]

interface BillingAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  isEdition?: boolean
  customer?: AddCustomerDrawerFragment | null
}

export const BillingAccordion: FC<BillingAccordionProps> = ({
  formikProps,
  isEdition,
  customer,
}) => {
  const { translate } = useInternationalization()
  const [isShippingEqualBillingAddress, setIsShippingEqualBillingAddress] = useState(false)

  useEffect(() => {
    if (isShippingEqualBillingAddress) {
      formikProps.setFieldValue('shippingAddress', {
        addressLine1: formikProps.values.addressLine1,
        addressLine2: formikProps.values.addressLine2,
        city: formikProps.values.city,
        country: formikProps.values.country,
        state: formikProps.values.state,
        zipcode: formikProps.values.zipcode,
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikProps.values.addressLine1,
    formikProps.values.addressLine2,
    formikProps.values.city,
    formikProps.values.country,
    formikProps.values.state,
    formikProps.values.zipcode,
    isShippingEqualBillingAddress,
  ])

  return (
    <Accordion
      size="large"
      summary={
        <Typography variant="subhead">{translate('text_632b49e2620ea4c6d96c9662')}</Typography>
      }
    >
      <div className="not-last-child:mb-8">
        <div className="not-last-child:mb-6">
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_626c0c09812bbc00e4c59dff')}
          </Typography>
          <ComboBoxField
            disabled={!!customer && !customer?.canEditAttributes}
            label={translate('text_632c6e59b73f9a54d4c72247')}
            placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
            infoText={translate(
              !customer?.canEditAttributes && isEdition
                ? 'text_632c6e59b73f9a54d4c7223d'
                : 'text_632c6e59b73f9a54d4c7223f',
            )}
            name="currency"
            data={Object.values(CurrencyEnum).map((currencyType) => ({
              value: currencyType,
            }))}
            disableClearable
            formikProps={formikProps}
          />
          <TextInputField
            name="legalName"
            label={translate('text_626c0c09812bbc00e4c59e01')}
            placeholder={translate('text_626c0c09812bbc00e4c59e03')}
            formikProps={formikProps}
          />
          <TextInputField
            name="legalNumber"
            label={translate('text_626c0c09812bbc00e4c59e05')}
            placeholder={translate('text_626c0c09812bbc00e4c59e07')}
            formikProps={formikProps}
          />
          <TextInputField
            name="taxIdentificationNumber"
            label={translate('text_648053ee819b60364c675d05')}
            placeholder={translate('text_648053ee819b60364c675d0b')}
            formikProps={formikProps}
          />
          <TextInputField
            name="email"
            beforeChangeFormatter={['lowercase']}
            label={translate('text_626c0c09812bbc00e4c59e09')}
            placeholder={translate('text_626c0c09812bbc00e4c59e0b')}
            formikProps={formikProps}
            helperText={translate('text_641394c4c936000079c5639a')}
          />
          <TextInputField
            name="url"
            label={translate('text_641b15b0df87eb00848944ea')}
            placeholder={translate('text_641b15e7ac746900b68377f9')}
            formikProps={formikProps}
          />
          <TextInputField
            name="phone"
            label={translate('text_626c0c09812bbc00e4c59e0d')}
            placeholder={translate('text_626c0c09812bbc00e4c59e0f')}
            formikProps={formikProps}
          />
        </div>
        <div className="not-last-child:mb-4">
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_626c0c09812bbc00e4c59e19')}
          </Typography>

          {billingFields.map((field) => {
            if (field.type === 'text') {
              return (
                <TextInputField
                  key={field.name}
                  name={field.name}
                  label={field.label && translate(field.label)}
                  placeholder={field.placeholder && translate(field.placeholder)}
                  formikProps={formikProps}
                />
              )
            }

            return (
              <ComboBoxField
                key={field.name}
                data={field.data}
                name={field.name}
                placeholder={field.placeholder && translate(field.placeholder)}
                formikProps={formikProps}
                PopperProps={{ displayInDialog: true }}
              />
            )
          })}
        </div>
        <div className="not-last-child:mb-4">
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_667d708c1359b49f5a5a8230')}
          </Typography>
          <Checkbox
            label={translate('text_667d708c1359b49f5a5a8234')}
            value={isShippingEqualBillingAddress}
            onChange={() => setIsShippingEqualBillingAddress((prev) => !prev)}
          />
          {billingFields.map((field) => {
            if (field.type === 'text') {
              return (
                <TextInputField
                  key={`shippingAddress.${field.name}`}
                  name={`shippingAddress.${field.name}`}
                  label={field.label && translate(field.label)}
                  placeholder={field.placeholder && translate(field.placeholder)}
                  formikProps={formikProps}
                  disabled={isShippingEqualBillingAddress}
                />
              )
            }

            return (
              <ComboBoxField
                key={`shippingAddress.${field.name}`}
                name={`shippingAddress.${field.name}`}
                placeholder={field.placeholder && translate(field.placeholder)}
                formikProps={formikProps}
                disabled={isShippingEqualBillingAddress}
                PopperProps={{ displayInDialog: true }}
                data={field.data}
              />
            )
          })}
        </div>
      </div>
    </Accordion>
  )
}
