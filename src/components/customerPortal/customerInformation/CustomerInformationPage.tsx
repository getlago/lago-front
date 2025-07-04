import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { object, string } from 'yup'

import useCustomerPortalNavigation from '~/components/customerPortal/common/hooks/useCustomerPortalNavigation'
import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionError from '~/components/customerPortal/common/SectionError'
import { LoaderCustomerInformationPage } from '~/components/customerPortal/common/SectionLoading'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Alert, Button, Typography } from '~/components/designSystem'
import { Checkbox, ComboBoxField, TextInputField } from '~/components/form'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import {
  CustomerTypeEnum,
  UpdateCustomerInput,
  UpdateCustomerPortalCustomerInput,
  useGetPortalCustomerInfosQuery,
  useUpdatePortalCustomerMutation,
} from '~/generated/graphql'

type EditCustomerBillingFormProps = {
  customer?: UpdateCustomerPortalCustomerInput | null
  onSuccess?: () => void
}

gql`
  mutation updatePortalCustomer($input: UpdateCustomerPortalCustomerInput!) {
    updateCustomerPortalCustomer(input: $input) {
      id
    }
  }
`

const EditCustomerBillingForm = ({ customer, onSuccess }: EditCustomerBillingFormProps) => {
  const { translate } = useCustomerPortalTranslate()

  const [isShippingEqualBillingAddress, setIsShippingEqualBillingAddress] = useState(false)

  const [
    updatePortalCustomer,
    { loading: updatePortalCustomerLoading, error: updatePortalCustomerError },
  ] = useUpdatePortalCustomerMutation({
    onCompleted(res) {
      if (res) {
        onSuccess?.()
      }
    },
  })

  const formikProps = useFormik<Partial<UpdateCustomerInput>>({
    initialValues: {
      customerType: customer?.customerType ?? null,
      name: customer?.name ?? '',
      firstname: customer?.firstname ?? '',
      lastname: customer?.lastname ?? '',
      legalName: customer?.legalName ?? undefined,
      taxIdentificationNumber: customer?.taxIdentificationNumber ?? undefined,
      email: customer?.email ?? undefined,

      addressLine1: customer?.addressLine1 ?? undefined,
      addressLine2: customer?.addressLine2 ?? undefined,
      zipcode: customer?.zipcode ?? undefined,
      city: customer?.city ?? undefined,
      state: customer?.state ?? undefined,
      country: customer?.country ?? undefined,

      shippingAddress: customer?.shippingAddress ?? undefined,
    },
    validationSchema: object().shape({
      customerType: string().oneOf(Object.values(CustomerTypeEnum)).nullable(),
      name: string(),
      firstname: string(),
      lastname: string(),
      email: string().email('text_620bc4d4269a55014d493fc3'),
    }),
    onSubmit: async (values) => {
      updatePortalCustomer({
        variables: {
          input: {
            ...values,
          },
        },
      })
    },
  })

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

  if (!customer) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="subhead2" color="grey700">
        {translate('text_1728377307159eu0ihwiyrf0')}
      </Typography>

      <ComboBoxField
        name="customerType"
        label={translate('text_1726128938631ioz4orixel3')}
        placeholder={translate('text_17261289386318j0nhr1ms3t')}
        formikProps={formikProps}
        PopperProps={{ displayInDialog: true }}
        data={Object.values(CustomerTypeEnum).map((customerValue) => ({
          value: customerValue,
          label: translate(TRANSLATIONS_MAP_CUSTOMER_TYPE[customerValue]),
        }))}
      />

      <TextInputField
        name="name"
        label={translate('text_634687079be251fdb43833cb')}
        placeholder={translate('text_1728654170904707saidat0f')}
        formikProps={formikProps}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInputField
          name="firstname"
          label={translate('text_1726128938631ggtf2ggqs4b')}
          placeholder={translate('text_1726128938631ntcpbzv7x7s')}
          formikProps={formikProps}
        />

        <TextInputField
          name="lastname"
          label={translate('text_1726128938631ymctg83bygm')}
          placeholder={translate('text_1726128938631xmpsba9ssuo')}
          formikProps={formikProps}
        />
      </div>

      <TextInputField
        name="legalName"
        label={translate('text_626c0c09812bbc00e4c59e01')}
        placeholder={translate('text_626c0c09812bbc00e4c59e03')}
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
      />

      <Typography variant="subhead2" color="grey700" className="mt-12">
        {translate('text_1728377307159y9afykbx2q9')}
      </Typography>

      <TextInputField
        name="addressLine1"
        label={translate('text_626c0c09812bbc00e4c59e1b')}
        placeholder={translate('text_626c0c09812bbc00e4c59e1d')}
        formikProps={formikProps}
      />
      <TextInputField
        name="addressLine2"
        placeholder={translate('text_626c0c09812bbc00e4c59e1f')}
        formikProps={formikProps}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInputField
          name="zipcode"
          placeholder={translate('text_626c0c09812bbc00e4c59e21')}
          formikProps={formikProps}
        />
        <TextInputField
          name="city"
          placeholder={translate('text_626c0c09812bbc00e4c59e23')}
          formikProps={formikProps}
        />
      </div>

      <TextInputField
        name="state"
        placeholder={translate('text_626c0c09812bbc00e4c59e25')}
        formikProps={formikProps}
      />
      <ComboBoxField
        data={countryDataForCombobox}
        name="country"
        placeholder={translate('text_626c0c09812bbc00e4c59e27')}
        formikProps={formikProps}
        PopperProps={{ displayInDialog: true }}
      />

      <Typography variant="subhead2" color="grey700" className="mt-8">
        {translate('text_667d708c1359b49f5a5a8230')}
      </Typography>

      <Checkbox
        label={translate('text_667d708c1359b49f5a5a8234')}
        value={isShippingEqualBillingAddress}
        onChange={() => setIsShippingEqualBillingAddress((prev) => !prev)}
      />
      <TextInputField
        name="shippingAddress.addressLine1"
        label={translate('text_626c0c09812bbc00e4c59e1b')}
        placeholder={translate('text_626c0c09812bbc00e4c59e1d')}
        formikProps={formikProps}
        disabled={isShippingEqualBillingAddress}
      />
      <TextInputField
        name="shippingAddress.addressLine2"
        placeholder={translate('text_626c0c09812bbc00e4c59e1f')}
        formikProps={formikProps}
        disabled={isShippingEqualBillingAddress}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInputField
          name="shippingAddress.zipcode"
          placeholder={translate('text_626c0c09812bbc00e4c59e21')}
          formikProps={formikProps}
          disabled={isShippingEqualBillingAddress}
        />
        <TextInputField
          name="shippingAddress.city"
          placeholder={translate('text_626c0c09812bbc00e4c59e23')}
          formikProps={formikProps}
          disabled={isShippingEqualBillingAddress}
        />
      </div>

      <TextInputField
        name="shippingAddress.state"
        placeholder={translate('text_626c0c09812bbc00e4c59e25')}
        formikProps={formikProps}
        disabled={isShippingEqualBillingAddress}
      />
      <ComboBoxField
        data={countryDataForCombobox}
        name="shippingAddress.country"
        placeholder={translate('text_626c0c09812bbc00e4c59e27')}
        formikProps={formikProps}
        disabled={isShippingEqualBillingAddress}
        PopperProps={{ displayInDialog: true }}
      />

      {updatePortalCustomerError && (
        <Alert className="mt-8" type="danger" data-test="error-alert">
          <Typography>{translate('text_1728377307160tb09yisgxk9')}</Typography>
        </Alert>
      )}

      <div className="flex justify-end">
        <div>
          <Button
            className="mt-8"
            size="medium"
            disabled={!formikProps.isValid}
            loading={formikProps.isSubmitting || updatePortalCustomerLoading}
            fullWidth
            data-test="submit"
            onClick={formikProps.submitForm}
          >
            {translate('text_17283773071596dmecu79kx4')}
          </Button>
        </div>
      </div>
    </div>
  )
}

const CustomerInformationPage = () => {
  const { goHome } = useCustomerPortalNavigation()
  const { translate } = useCustomerPortalTranslate()

  const {
    data: portalCustomerInfosData,
    loading: portalCustomerInfosLoading,
    error: portalCustomerInfosError,
    refetch: portalCustomerInfosRefetch,
  } = useGetPortalCustomerInfosQuery()

  const customerPortalUser = portalCustomerInfosData?.customerPortalUser

  const isLoading = portalCustomerInfosLoading
  const isError = !isLoading && portalCustomerInfosError

  if (isError) {
    return (
      <div>
        <PageTitle title={translate('text_1728377307159nbrs3pgng03')} goHome={goHome} />

        <SectionError refresh={() => portalCustomerInfosRefetch} />
      </div>
    )
  }

  return (
    <div>
      <PageTitle title={translate('text_1728377307159nbrs3pgng03')} goHome={goHome} />

      {isLoading && <LoaderCustomerInformationPage />}

      {!isLoading && <EditCustomerBillingForm customer={customerPortalUser} onSuccess={goHome} />}
    </div>
  )
}

export default CustomerInformationPage
