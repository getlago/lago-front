import { useFormik } from 'formik'
import { Icon } from 'lago-design-system'
import { debounce } from 'lodash'
import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { array, object, ref, string } from 'yup'

import { BillingAccordion } from '~/components/customers/createCustomer/BillingAccordion'
import { CustomerInformation } from '~/components/customers/createCustomer/CustomerInformation'
import { ExternalAppsAccordion } from '~/components/customers/createCustomer/ExternalAppsAccordion'
import {
  LocalCustomerMetadata,
  MetadataAccordion,
} from '~/components/customers/createCustomer/MetadataAccordion'
import { Button, DrawerRef, Typography } from '~/components/designSystem'
import { SwitchField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { metadataSchema } from '~/formValidation/metadataSchema'
import {
  AnrokCustomer,
  CreateCustomerInput,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  CustomerTypeEnum,
  HubspotCustomer,
  IntegrationTypeEnum,
  NetsuiteCustomer,
  PremiumIntegrationTypeEnum,
  ProviderCustomer,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  SalesforceCustomer,
  UpdateCustomerInput,
  useGetBillingEntitiesQuery,
  XeroCustomer,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const DEBOUNCE_MS = window.Cypress ? 0 : 150

const CreateCustomer = () => {
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const hasAccessToRevenueShare = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.RevenueShare,
  )

  const { isEdition, onSave, customer, loading, onClose } = useCreateEditCustomer()

  const { data: billingEntitiesData, loading: billingEntitiesLoading } =
    useGetBillingEntitiesQuery()

  const billingEntitiesList = useMemo(
    () =>
      billingEntitiesData?.billingEntities?.collection
        ?.map((billingEntity) => ({
          label: `${billingEntity.name || billingEntity.code}${billingEntity.isDefault ? ` (${translate('text_1744018116743pwoqp40bkhp')})` : ''}`,
          value: billingEntity.code,
          isDefault: billingEntity.isDefault,
        }))
        .sort((a) => (a.isDefault ? -1 : 1)) || [],
    [billingEntitiesData, translate],
  )

  const defaultBillingEntity = billingEntitiesList?.find((b) => b.isDefault)

  const canEditAccountType =
    hasAccessToRevenueShare && (isEdition ? customer?.canEditAttributes : true)

  const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
    initialValues: {
      customerType: customer?.customerType ?? null,
      accountType:
        customer?.accountType === CustomerAccountTypeEnum.Partner
          ? CustomerAccountTypeEnum.Partner
          : null,
      name: customer?.name ?? '',
      firstname: customer?.firstname ?? '',
      lastname: customer?.lastname ?? '',
      externalId: customer?.externalId ?? '',
      externalSalesforceId: customer?.externalSalesforceId ?? '',
      legalName: customer?.legalName ?? undefined,
      legalNumber: customer?.legalNumber ?? undefined,
      taxIdentificationNumber: customer?.taxIdentificationNumber ?? undefined,
      currency: customer?.currency ?? undefined,
      phone: customer?.phone ?? undefined,
      email: customer?.email ?? undefined,
      addressLine1: customer?.addressLine1 ?? undefined,
      addressLine2: customer?.addressLine2 ?? undefined,
      state: customer?.state ?? undefined,
      country: customer?.country ?? undefined,
      city: customer?.city ?? undefined,
      zipcode: customer?.zipcode ?? undefined,
      shippingAddress: customer?.shippingAddress ?? undefined,
      timezone: customer?.timezone ?? undefined,
      url: customer?.url ?? undefined,
      integrationCustomers: [
        ...(!!customer?.netsuiteCustomer ? [customer?.netsuiteCustomer] : []),
        ...(!!customer?.avalaraCustomer ? [customer?.avalaraCustomer] : []),
        ...(!!customer?.anrokCustomer ? [customer?.anrokCustomer] : []),
        ...(!!customer?.xeroCustomer ? [customer?.xeroCustomer] : []),
        ...(!!customer?.hubspotCustomer ? [customer?.hubspotCustomer] : []),
        ...(!!customer?.salesforceCustomer ? [customer?.salesforceCustomer] : []),
      ],
      paymentProviderCode: customer?.paymentProviderCode ?? undefined,
      providerCustomer: {
        providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? '',
        syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
        providerPaymentMethods: customer?.providerCustomer?.providerPaymentMethods?.length
          ? customer?.providerCustomer?.providerPaymentMethods
          : customer?.currency !== CurrencyEnum.Eur
            ? [ProviderPaymentMethodsEnum.Card]
            : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
      },
      paymentProvider: customer?.paymentProvider ?? undefined,
      metadata: customer?.metadata ?? undefined,
      billingEntityCode: customer?.billingEntity?.code ?? defaultBillingEntity?.value ?? null,
    },
    validationSchema: object().shape({
      customerType: string().oneOf(Object.values(CustomerTypeEnum)).nullable(),
      name: string(),
      firstname: string(),
      lastname: string(),
      email: string().emails('text_620bc4d4269a55014d493fc3'),
      externalId: string().required(''),
      metadata: metadataSchema(),
      providerCustomer: object().test({
        test: function (value: Omit<ProviderCustomer, 'id'>, { from }) {
          // Value can be undefined if no paymentProvider is selected
          if (value && from && from[1] && !from[1].value.paymentProvider) {
            return true
          }

          // if code is not selected, validation fails
          if (value && from && from[1] && !from[1].value.paymentProviderCode) {
            return false
          }

          if (
            ![ProviderTypeEnum.Cashfree, ProviderTypeEnum.Flutterwave].includes(
              from?.[1].value.paymentProvider,
            )
          ) {
            // if syncWithProvider is false, providerCustomerId is required
            if (!value?.syncWithProvider && !value?.providerCustomerId) {
              return false
            }
          }

          return true
        },
      }),
      integrationCustomers: array()
        .of(
          object()
            .test({
              test: function (
                value:
                  | Omit<NetsuiteCustomer, 'id'>
                  | Omit<AnrokCustomer, 'id'>
                  | Omit<XeroCustomer, 'id'>
                  | Omit<HubspotCustomer, 'id'>
                  | Omit<SalesforceCustomer, 'id'>,
              ) {
                if (!!value) {
                  if (value.integrationType === IntegrationTypeEnum.Netsuite) {
                    value = value as NetsuiteCustomer
                    // If Netsuite integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // If syncWithProvider is true but no subsidiary is selected
                    if (value?.syncWithProvider && !value?.subsidiaryId) {
                      return false
                    }
                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Anrok) {
                    value = value as AnrokCustomer
                    // If Anrok integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Xero) {
                    value = value as XeroCustomer
                    // If Xero integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Hubspot) {
                    value = value as HubspotCustomer
                    // If Hubspot integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // targetedObject needs to be selected
                    if (!value?.targetedObject) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Salesforce) {
                    value = value as SalesforceCustomer

                    // If Salesforce integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false then externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  }
                }

                return true
              },
            })
            .nullable(),
        )
        .nullable(),
      billingEntityCode: string(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: async ({ metadata, ...values }, formikBag) => {
      const answer = await onSave({
        ...values,
        metadata: ((metadata as LocalCustomerMetadata[]) || []).map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ localId, ...rest }) => rest,
        ),
      })

      const { errors } = answer

      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        formikBag.setFieldError('externalId', translate('text_626162c62f790600f850b728'))
      } else {
        ;(ref as unknown as RefObject<DrawerRef>)?.current?.closeDrawer()
        !isEdition && formikBag.resetForm()
      }
    },
  })

  const debouncedValidate = useMemo(
    () => debounce(formikProps.validateForm, DEBOUNCE_MS, { leading: true }),
    [formikProps.validateForm],
  )

  useEffect(() => {
    debouncedValidate(formikProps.values)
  }, [formikProps.values, debouncedValidate])

  const onAbort = useCallback(() => {
    formikProps.dirty ? warningDialogRef.current?.openDialog() : onClose()
  }, [formikProps.dirty, onClose])

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {isEdition
            ? translate('text_1735651472114fzhjvrrcumw')
            : translate('text_1734452833961s338w0x3b4s')}
        </Typography>
        <Button variant="quaternary" icon="close" onClick={onAbort} />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="create-customer" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="not-last-child:mb-1">
            <Typography variant="headline" color="textSecondary">
              {isEdition
                ? translate('text_1735651472114fzhjvrrcumw')
                : translate('text_1734452833961s338w0x3b4s')}
            </Typography>
            <Typography variant="body">{translate('text_1734452833961ix7z38723pg')}</Typography>
          </div>

          <div className="mb-8 flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
            {/* eslint-disable-next-line */}
            <div
              className="flex items-center justify-between"
              onClick={() => {
                if (!hasAccessToRevenueShare) {
                  premiumWarningDialogRef.current?.openDialog()
                }
              }}
            >
              <SwitchField
                name="accountType"
                formikProps={formikProps}
                label={translate('text_173832066416253fgbilrnae')}
                subLabel={translate('text_173832066416219scp0nqeo8')}
                labelPosition="right"
                disabled={!canEditAccountType}
              />

              {!hasAccessToRevenueShare && <Icon name="sparkles" />}
            </div>

            <CustomerInformation
              formikProps={formikProps}
              isEdition={isEdition}
              customer={customer}
              billingEntitiesList={billingEntitiesList}
              billingEntitiesLoading={billingEntitiesLoading}
            />
            <BillingAccordion formikProps={formikProps} isEdition={isEdition} customer={customer} />
            <MetadataAccordion formikProps={formikProps} />
            <ExternalAppsAccordion formikProps={formikProps} isEdition={isEdition} />
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <Button size="large" variant="quaternary" onClick={onAbort}>
          {translate('text_62e79671d23ae6ff149de968')}
        </Button>
        <Button
          size="large"
          variant="primary"
          loading={formikProps.isSubmitting}
          disabled={!formikProps.isValid || !formikProps.dirty}
          onClick={formikProps.submitForm}
          data-test="submit-customer"
        >
          {isEdition
            ? translate('text_17295436903260tlyb1gp1i7')
            : translate('text_632b49e2620ea4c6d96c9666')}
        </Button>
      </CenteredPage.StickyFooter>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={onClose}
      />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </CenteredPage.Wrapper>
  )
}

export default CreateCustomer
