import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { Dispatch, FC, ReactNode, SetStateAction, useMemo } from 'react'

import { Accordion, Alert, Avatar, Typography } from '~/components/designSystem'
import { Checkbox, ComboBox, ComboboxDataGrouped, TextInputField } from '~/components/form'
import { ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION } from '~/core/constants/form'
import {
  CreateCustomerInput,
  CurrencyEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
  usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Cashfree from '~/public/images/cashfree.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Stripe from '~/public/images/stripe.svg'

import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'

gql`
  query paymentProvidersListForCustomerCreateEditExternalAppsAccordion($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on CashfreeProvider {
          __typename
          id
          name
          code
        }

        ... on StripeProvider {
          __typename
          id
          name
          code
        }

        ... on GocardlessProvider {
          __typename
          id
          name
          code
        }

        ... on AdyenProvider {
          __typename
          id
          name
          code
        }
      }
    }
  }
`

interface PaymentProvidersAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  setShowPaymentSection: Dispatch<SetStateAction<boolean>>
}

const avatarMapping: Record<ProviderTypeEnum, ReactNode> = {
  [ProviderTypeEnum.Adyen]: <Adyen />,
  [ProviderTypeEnum.Cashfree]: <Cashfree />,
  [ProviderTypeEnum.Gocardless]: <GoCardless />,
  [ProviderTypeEnum.Stripe]: <Stripe />,
}

export const PaymentProvidersAccordion: FC<PaymentProvidersAccordionProps> = ({
  formikProps,
  setShowPaymentSection,
}) => {
  const { translate } = useInternationalization()
  const { data: { paymentProviders } = {}, loading } =
    usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  const selectedPaymentProvider = paymentProviders?.collection.find(
    (p) => p.code === formikProps.values.paymentProviderCode,
  )

  const isSyncWithProviderDisabled = !!formikProps.values.providerCustomer?.syncWithProvider

  const connectedPaymentProvidersData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!paymentProviders?.collection.length) return []

    return paymentProviders?.collection.map((provider) => ({
      value: provider.code,
      label: provider.name,
      group: provider.__typename.toLocaleLowerCase().replace('provider', ''),
      labelNode: (
        <ExternalAppsAccordionLayout.ComboboxItem label={provider.name} subLabel={provider.code} />
      ),
    }))
  }, [paymentProviders?.collection])

  const isSyncWithProviderSupported = useMemo(() => {
    if (!formikProps.values.paymentProvider) return false
    const unsupportedPaymentProviders: ProviderTypeEnum[] = [ProviderTypeEnum.Cashfree]

    return !unsupportedPaymentProviders.includes(formikProps.values.paymentProvider)
  }, [formikProps.values.paymentProvider])

  const onSetPaymentMethod = (method: ProviderPaymentMethodsEnum, checked: boolean) => {
    let newValue = [...(formikProps.values.providerCustomer?.providerPaymentMethods || [])]

    if (checked) {
      newValue.push(method)
    } else {
      newValue = newValue.filter((value) => value !== method)
    }

    formikProps.setFieldValue('providerCustomer.providerPaymentMethods', newValue)
  }

  return (
    <div>
      <Typography variant="captionHl" color="grey700" className="mb-1">
        {translate('text_634ea0ecc6147de10ddb6631')}
      </Typography>
      <Accordion
        noContentMargin
        className={ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION}
        summary={
          <ExternalAppsAccordionLayout.Summary
            loading={loading}
            avatar={
              formikProps.values.paymentProvider && (
                <Avatar size="big" variant="connector-full">
                  {avatarMapping[formikProps.values.paymentProvider]}
                </Avatar>
              )
            }
            label={selectedPaymentProvider?.name}
            subLabel={selectedPaymentProvider?.code}
            onDelete={() => {
              formikProps.setFieldValue('paymentProvider', null)
              formikProps.setFieldValue('providerCustomer.providerCustomerId', '')
              formikProps.setFieldValue('providerCustomer.syncWithProvider', false)
              formikProps.setFieldValue(
                'providerCustomer.providerPaymentMethods',
                formikProps.values.currency !== CurrencyEnum.Eur
                  ? [ProviderPaymentMethodsEnum.Card]
                  : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
              )
              setShowPaymentSection(false)
            }}
          />
        }
      >
        <div>
          <div className="flex flex-col gap-6 p-4">
            <Typography variant="bodyHl" color="grey700">
              {translate('text_65e1f90471bc198c0c934d6c')}
            </Typography>

            {/* Select connected account */}
            <ComboBox
              data={connectedPaymentProvidersData}
              label={translate('text_65940198687ce7b05cd62b61')}
              placeholder={translate('text_65940198687ce7b05cd62b62')}
              emptyText={translate('text_6645daa0468420011304aded')}
              PopperProps={{ displayInDialog: true }}
              value={formikProps.values.paymentProviderCode as string}
              onChange={(value) => {
                formikProps.setFieldValue('paymentProviderCode', value)
                const selectedProvider = connectedPaymentProvidersData.find(
                  (provider) => provider.value === value,
                )?.group

                // Set paymentProvider depending on selected value
                formikProps.setFieldValue('paymentProvider', selectedProvider as ProviderTypeEnum)
              }}
            />

            {!!formikProps.values.paymentProviderCode && isSyncWithProviderSupported && (
              <>
                <TextInputField
                  name="providerCustomer.providerCustomerId"
                  disabled={isSyncWithProviderDisabled}
                  label={translate('text_62b328ead9a4caef81cd9ca0')}
                  placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                  formikProps={formikProps}
                />

                <Checkbox
                  name="providerCustomer.syncWithProvider"
                  value={!!formikProps.values.providerCustomer?.syncWithProvider}
                  label={`${
                    formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                      ? translate('text_635bdbda84c98758f9bba8aa')
                      : formikProps.values.paymentProvider === ProviderTypeEnum.Adyen
                        ? translate('text_645d0728ea0a5a7bbf76d5c7')
                        : translate('text_635bdbda84c98758f9bba89e')
                  }${
                    formikProps.values.paymentProviderCode
                      ? ` • ${
                          connectedPaymentProvidersData.find(
                            (provider) => provider.value === formikProps.values.paymentProviderCode,
                          )?.label
                        }`
                      : ''
                  }`}
                  onChange={(e, checked) => {
                    const newProviderCustomer = { ...formikProps.values.providerCustomer }

                    newProviderCustomer.syncWithProvider = checked
                    if (checked) {
                      newProviderCustomer.providerCustomerId = ''
                    }
                    formikProps.setFieldValue('providerCustomer', newProviderCustomer)
                  }}
                />
              </>
            )}
          </div>

          {formikProps.values.paymentProvider === ProviderTypeEnum.Stripe && (
            <div className="flex flex-col gap-6 p-4 shadow-t">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_64aeb7b998c4322918c84204')}
                </Typography>
                <Typography variant="caption">
                  {translate('text_64aeb7b998c4322918c84210')}
                </Typography>
              </div>

              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey700">
                  {translate('text_65e1f90471bc198c0c934d82')}
                </Typography>
                <div className="grid grid-cols-2 gap-4">
                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.card"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.Card,
                      )
                    }
                    label={translate('text_64aeb7b998c4322918c84208')}
                    sublabel={translate('text_65e1f90471bc198c0c934d86')}
                    disabled={
                      (formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                        formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                          ProviderPaymentMethodsEnum.Card,
                        )) ||
                      (formikProps.values.providerCustomer?.providerPaymentMethods?.length === 2 &&
                        formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                          ProviderPaymentMethodsEnum.Card,
                        ) &&
                        formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                          ProviderPaymentMethodsEnum.Link,
                        ))
                    }
                    onChange={(e, checked) => {
                      let newValue = [
                        ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
                      ]

                      if (checked) {
                        newValue.push(ProviderPaymentMethodsEnum.Card)
                      } else {
                        // Note: Link option cannot be selected without card
                        newValue = newValue.filter(
                          (method) =>
                            method !== ProviderPaymentMethodsEnum.Card &&
                            method !== ProviderPaymentMethodsEnum.Link,
                        )
                      }

                      formikProps.setFieldValue('providerCustomer.providerPaymentMethods', newValue)
                    }}
                  />

                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.link"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.Link,
                      )
                    }
                    label={translate('text_6686b316b672a6e75a29eea0')}
                    sublabel={translate('text_6686b316b672a6e75a29eea2')}
                    disabled={
                      !(formikProps.values.providerCustomer?.providerPaymentMethods || []).includes(
                        ProviderPaymentMethodsEnum.Card,
                      )
                    }
                    onChange={(_e, checked) => {
                      onSetPaymentMethod(ProviderPaymentMethodsEnum.Link, checked)
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey700">
                  {translate('text_65e1f90471bc198c0c934d88')}
                </Typography>

                <div className="grid grid-cols-2 gap-4">
                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.sepa_debit"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.SepaDebit,
                      )
                    }
                    label={translate('text_64aeb7b998c4322918c8420c')}
                    sublabel={translate('text_65e1f90471bc198c0c934d8c')}
                    disabled={
                      formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                      formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                        ProviderPaymentMethodsEnum.SepaDebit,
                      )
                    }
                    onChange={(_e, checked) => {
                      onSetPaymentMethod(ProviderPaymentMethodsEnum.SepaDebit, checked)
                    }}
                  />

                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.us_bank_account"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.UsBankAccount,
                      )
                    }
                    label={translate('text_65e1f90471bc198c0c934d8e')}
                    sublabel={translate('text_65e1f90471bc198c0c934d90')}
                    disabled={
                      formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                      formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                        ProviderPaymentMethodsEnum.UsBankAccount,
                      )
                    }
                    onChange={(_e, checked) => {
                      onSetPaymentMethod(ProviderPaymentMethodsEnum.UsBankAccount, checked)
                    }}
                  />

                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.bacs_debit"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.BacsDebit,
                      )
                    }
                    label={translate('text_65e1f90471bc198c0c934d92')}
                    sublabel={translate('text_65e1f90471bc198c0c934d94')}
                    disabled={
                      formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                      formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                        ProviderPaymentMethodsEnum.BacsDebit,
                      )
                    }
                    onChange={(_e, checked) => {
                      onSetPaymentMethod(ProviderPaymentMethodsEnum.BacsDebit, checked)
                    }}
                  />

                  <Checkbox
                    name="providerCustomer.providerPaymentMethods.boleto"
                    value={
                      !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                        ProviderPaymentMethodsEnum.Boleto,
                      )
                    }
                    label={translate('text_1738234109827diqh4eswleu')}
                    sublabel={translate('text_1738234109827hev75h17loy')}
                    disabled={
                      formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                      formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                        ProviderPaymentMethodsEnum.Boleto,
                      )
                    }
                    onChange={(_e, checked) => {
                      onSetPaymentMethod(ProviderPaymentMethodsEnum.Boleto, checked)
                    }}
                  />
                </div>
              </div>

              <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  )
}
