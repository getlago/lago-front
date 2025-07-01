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
  { name: keyof CustomerAddress; label?: string; placeholder?: string; className?: string } & (
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
    label: 'text_626c0c09812bbc00e4c59e1d',
    placeholder: 'text_1735653854525cemtriccmuh',
    className: 'col-span-2',
  },
  {
    name: 'addressLine2',
    type: 'text',
    label: 'text_626c0c09812bbc00e4c59e1f',
    placeholder: 'text_1735653854525dq6plq7exd3',
    className: 'col-span-2',
  },
  {
    name: 'zipcode',
    type: 'text',
    label: 'text_626c0c09812bbc00e4c59e21',
    placeholder: 'text_1735654189136h4rgi3zdwaa',
  },
  {
    name: 'city',
    type: 'text',
    label: 'text_626c0c09812bbc00e4c59e23',
    placeholder: 'text_1735654189136vn4mbzp4jhs',
  },
  {
    name: 'state',
    type: 'text',
    label: 'text_626c0c09812bbc00e4c59e25',
    placeholder: 'text_173565418913690jb89ypb63',
    className: 'col-span-2',
  },
  {
    name: 'country',
    type: 'combobox',
    label: 'text_626c0c09812bbc00e4c59e27',
    data: countryDataForCombobox,
    placeholder: 'text_1735654189136s548dkluunb',
    className: 'col-span-2',
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
      variant="borderless"
      summary={
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_632b49e2620ea4c6d96c9662')}</Typography>
          <Typography variant="caption">{translate('text_1735653854525b68ew2qbpdp')}</Typography>
        </div>
      }
    >
      <div className="not-last-child:mb-8">
        <div className="not-last-child:mb-6">
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
            {translate('text_626c0c301a16a600ea06148d')}
          </Typography>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {billingFields.map((field) => {
              if (field.type === 'text') {
                return (
                  <TextInputField
                    key={field.name}
                    name={field.name}
                    label={field.label && translate(field.label)}
                    className={field.className}
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
                  label={field.label && translate(field.label)}
                  containerClassName={field.className}
                  placeholder={field.placeholder && translate(field.placeholder)}
                  formikProps={formikProps}
                  PopperProps={{ displayInDialog: true }}
                />
              )
            })}
          </div>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {billingFields.map((field) => {
              if (field.type === 'text') {
                return (
                  <TextInputField
                    key={`shippingAddress.${field.name}`}
                    name={`shippingAddress.${field.name}`}
                    label={field.label && translate(field.label)}
                    className={field.className}
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
                  label={field.label && translate(field.label)}
                  containerClassName={field.className}
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
      </div>
    </Accordion>
  )
}
