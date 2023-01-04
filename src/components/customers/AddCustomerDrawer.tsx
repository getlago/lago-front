import { forwardRef, useEffect, useState, RefObject } from 'react'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'

import { Drawer, Button, DrawerRef, Typography, Accordion, Alert } from '~/components/designSystem'
import { TextInputField, ComboBoxField, Checkbox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { theme, Card, DrawerTitle, DrawerContent, DrawerSubmitButton } from '~/styles'
import {
  AddCustomerDrawerFragment,
  AddCustomerDrawerDetailFragment,
  CreateCustomerInput,
  UpdateCustomerInput,
  ProviderTypeEnum,
  CurrencyEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import CountryCodes from '~/public/countryCode.json'
import { INTEGRATIONS_ROUTE, ORGANIZATION_INFORMATIONS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import { useOrganizationTimezone } from '~/hooks/useOrganizationTimezone'
import { useIsPremiumUser } from '~/hooks/customer/useIsPremiumUser'

const countryData: { value: string; label: string }[] = Object.keys(CountryCodes).map(
  (countryKey) => {
    return {
      value: countryKey,
      // @ts-ignore
      label: CountryCodes[countryKey],
    }
  }
)

const providerData: { value: ProviderTypeEnum; label: string }[] = Object.keys(
  ProviderTypeEnum
).map((provider) => ({
  // @ts-ignore
  value: ProviderTypeEnum[provider],
  label: provider,
}))

export interface AddCustomerDrawerRef extends DrawerRef {}

interface AddCustomerDrawerProps {
  customer?: AddCustomerDrawerFragment | AddCustomerDrawerDetailFragment | null
}

export const AddCustomerDrawer = forwardRef<DrawerRef, AddCustomerDrawerProps>(
  ({ customer }: AddCustomerDrawerProps, ref) => {
    const { translate } = useInternationalization()
    const isPremium = useIsPremiumUser()
    const { isEdition, onSave } = useCreateEditCustomer({
      customer,
    })
    const [isDisabled, setIsDisabled] = useState<boolean>(false)
    const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
      initialValues: {
        name: customer?.name ?? '',
        externalId: customer?.externalId ?? '',
        legalName: customer?.legalName ?? undefined,
        legalNumber: customer?.legalNumber ?? undefined,
        currency: customer?.currency ?? undefined,
        phone: customer?.phone ?? undefined,
        email: customer?.email ?? undefined,
        addressLine1: customer?.addressLine1 ?? undefined,
        addressLine2: customer?.addressLine2 ?? undefined,
        state: customer?.state ?? undefined,
        country: customer?.country ?? undefined,
        city: customer?.city ?? undefined,
        zipcode: customer?.zipcode ?? undefined,
        timezone: customer?.timezone ?? undefined,
        providerCustomer: {
          providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? undefined,
          syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
        },
        paymentProvider: customer?.paymentProvider ?? undefined,
      },
      validationSchema: object().shape({
        name: string().required(''),
        externalId: string().required(''),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values, formikBag) => {
        const answer = await onSave(values)
        const { errors } = answer

        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          formikBag.setFieldError('externalId', translate('text_626162c62f790600f850b728'))
        } else {
          ;(ref as unknown as RefObject<DrawerRef>)?.current?.closeDrawer()
          !isEdition && formikBag.resetForm()
        }
      },
    })
    const { timezoneConfig } = useOrganizationTimezone()

    useEffect(() => {
      if (!formikProps.values.paymentProvider) {
        // If no payment provider, reset stripe customer
        formikProps.setFieldValue('providerCustomer.providerCustomerId', undefined)
        formikProps.setFieldValue('providerCustomer.syncWithProvider', false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formikProps.values.paymentProvider])

    return (
      <Drawer
        ref={ref}
        title={translate(
          isEdition
            ? 'text_632b4acf0c41206cbcb8c2f6'
            : customer?.name
            ? 'text_632b49e2620ea4c6d96c9650'
            : 'text_632b49e2620ea4c6d96c9652',
          {
            customerName: customer?.name || '',
          }
        )}
        onClose={() => {
          formikProps.resetForm({
            values: {
              name: customer?.name ?? '',
              externalId: customer?.externalId ?? '',
              legalName: customer?.legalName ?? undefined,
              legalNumber: customer?.legalNumber ?? undefined,
              currency: customer?.currency ?? undefined,
              phone: customer?.phone ?? undefined,
              email: customer?.email ?? undefined,
              addressLine1: customer?.addressLine1 ?? undefined,
              addressLine2: customer?.addressLine2 ?? undefined,
              state: customer?.state ?? undefined,
              country: customer?.country ?? undefined,
              city: customer?.city ?? undefined,
              zipcode: customer?.zipcode ?? undefined,
              providerCustomer: {
                providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? undefined,
                syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
              },
              paymentProvider: customer?.paymentProvider ?? undefined,
            },
          })
          formikProps.validateForm()
        }}
      >
        <DrawerContent>
          <DrawerTitle>
            <Typography variant="headline">
              {translate(
                isEdition ? 'text_632b4acf0c41206cbcb8c2f8' : 'text_632b49e2620ea4c6d96c9652'
              )}
            </Typography>
            <Typography>
              {translate(
                isEdition ? 'text_632b4acf0c41206cbcb8c2fa' : 'text_632b49e2620ea4c6d96c9654'
              )}
            </Typography>
          </DrawerTitle>

          <Card>
            <Typography variant="subhead">{translate('text_626c0c09812bbc00e4c59df1')}</Typography>
            <TextInputField
              name="name"
              label={translate('text_624efab67eb2570101d117be')}
              placeholder={translate('text_624efab67eb2570101d117c6')}
              formikProps={formikProps}
            />
            <TextInputField
              name="externalId"
              disabled={isEdition && !customer?.canEditAttributes}
              label={translate('text_624efab67eb2570101d117ce')}
              placeholder={translate('text_624efab67eb2570101d117d6')}
              helperText={
                (!isEdition || customer?.canEditAttributes) &&
                translate('text_624efab67eb2570101d117de')
              }
              formikProps={formikProps}
            />

            <ComboBoxField
              name="timezone"
              label={translate('text_6390a4ffef9227ba45daca90')}
              placeholder={translate('text_6390a4ffef9227ba45daca92')}
              disabled={!isPremium}
              helperText={
                <Typography
                  variant="caption"
                  html={translate('text_6390a4ffef9227ba45daca94', {
                    timezone: translate('text_638f743fa9a2a9545ee6409a', {
                      zone: translate(timezoneConfig.name),
                      offset: timezoneConfig.offset,
                    }),
                    link: ORGANIZATION_INFORMATIONS_ROUTE,
                  })}
                />
              }
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
              data={Object.values(TimezoneEnum).map((timezoneValue) => ({
                value: timezoneValue,
                label: translate('text_638f743fa9a2a9545ee6409a', {
                  zone: translate(timezoneValue),
                  offset: getTimezoneConfig(timezoneValue).offset,
                }),
              }))}
            />
          </Card>
          <Accordion
            size="large"
            summary={
              <Typography variant="subhead">
                {translate('text_632b49e2620ea4c6d96c9662')}
              </Typography>
            }
          >
            <BillingBlock $first>
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
                    : 'text_632c6e59b73f9a54d4c7223f'
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
                name="email"
                label={translate('text_626c0c09812bbc00e4c59e09')}
                placeholder={translate('text_626c0c09812bbc00e4c59e0b')}
                formikProps={formikProps}
              />
              <TextInputField
                name="phone"
                label={translate('text_626c0c09812bbc00e4c59e0d')}
                placeholder={translate('text_626c0c09812bbc00e4c59e0f')}
                formikProps={formikProps}
              />
            </BillingBlock>
            <BillingBlock>
              <Typography variant="bodyHl" color="textSecondary">
                {translate('text_626c0c09812bbc00e4c59e19')}
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
              <TextInputField
                name="state"
                placeholder={translate('text_626c0c09812bbc00e4c59e25')}
                formikProps={formikProps}
              />
              <ComboBoxField
                data={countryData}
                name="country"
                placeholder={translate('text_626c0c09812bbc00e4c59e27')}
                formikProps={formikProps}
                PopperProps={{ displayInDialog: true }}
              />
            </BillingBlock>
          </Accordion>

          <Accordion
            size="large"
            summary={
              <Typography variant="subhead">
                {translate('text_632b49e2620ea4c6d96c9664')}
              </Typography>
            }
          >
            <BillingBlock>
              <ComboBoxField
                data={providerData}
                name="paymentProvider"
                label={translate('text_62b328ead9a4caef81cd9c9c')}
                placeholder={translate('text_62b328ead9a4caef81cd9c9e')}
                formikProps={formikProps}
                helperText={
                  !isEdition && (
                    <HelperText
                      html={translate('text_635bdbda84c98758f9bba8a0', {
                        link: INTEGRATIONS_ROUTE,
                      })}
                    />
                  )
                }
                PopperProps={{ displayInDialog: true }}
              />
              {(formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless ||
                formikProps.values.paymentProvider === ProviderTypeEnum.Stripe) && (
                <>
                  <TextInputField
                    name="providerCustomer.providerCustomerId"
                    disabled={isDisabled}
                    label={translate('text_62b328ead9a4caef81cd9ca0')}
                    placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                    formikProps={formikProps}
                  />
                  <Checkbox
                    name="providerCustomer.syncWithProvider"
                    value={formikProps.values.providerCustomer?.syncWithProvider}
                    label={
                      formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                        ? translate('text_635bdbda84c98758f9bba8aa')
                        : translate('text_635bdbda84c98758f9bba89e')
                    }
                    onChange={(_, checked) => {
                      setIsDisabled(checked)
                      formikProps.setFieldValue('providerCustomer.syncWithProvider', checked)
                      if (!isEdition && checked) {
                        formikProps.setFieldValue('providerCustomer.providerCustomerId', undefined)
                      }
                    }}
                  />
                </>
              )}
              {isDisabled && formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless && (
                <Alert type="info">{translate('text_635bdbda84c98758f9bba8ae')}</Alert>
              )}
            </BillingBlock>
          </Accordion>

          <DrawerSubmitButton>
            <Button
              size="large"
              disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
              loading={formikProps.isSubmitting}
              fullWidth
              data-test="submit"
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_632b4acf0c41206cbcb8c30c' : 'text_632b49e2620ea4c6d96c9666'
              )}
            </Button>
          </DrawerSubmitButton>
        </DrawerContent>
      </Drawer>
    )
  }
)

const HelperText = styled(Typography)`
  font-size: 14px;
  line-height: 20px;
`

const BillingBlock = styled.div<{ $first?: boolean }>`
  margin-bottom: ${({ $first }) => ($first ? theme.spacing(6) : 0)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddCustomerDrawer.displayName = 'AddCustomerDrawer'
