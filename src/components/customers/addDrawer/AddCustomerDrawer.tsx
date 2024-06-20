import { useFormik } from 'formik'
import { FieldWithPossiblyUndefined } from 'lodash'
import _get from 'lodash/get'
import React, { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { array, object, string } from 'yup'

import {
  Accordion,
  Button,
  Drawer,
  DrawerRef,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { ComboBoxField, Switch, TextInputField } from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { ORGANIZATION_INFORMATIONS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
  metadataSchema,
} from '~/formValidation/metadataSchema'
import {
  AddCustomerDrawerFragment,
  AnrokCustomer,
  CreateCustomerInput,
  CurrencyEnum,
  CustomerMetadataInput,
  IntegrationTypeEnum,
  NetsuiteCustomer,
  ProviderPaymentMethodsEnum,
  TimezoneEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { ExternalAppsAccordion } from './ExternalAppsAccordion'

const MAX_METADATA_COUNT = 5

export interface AddCustomerDrawerRef {
  openDrawer: (customer?: AddCustomerDrawerFragment | null) => unknown
  closeDrawer: () => unknown
}

interface LocalCustomerMetadata extends CustomerMetadataInput {
  localId?: string
}

export const AddCustomerDrawer = forwardRef<AddCustomerDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [customer, setCustomer] = useState<AddCustomerDrawerFragment | null | undefined>(null)
  const { isPremium } = useCurrentUser()
  const { isEdition, onSave } = useCreateEditCustomer({
    customer,
  })

  const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
    initialValues: {
      name: customer?.name ?? '',
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
      timezone: customer?.timezone ?? undefined,
      url: customer?.url ?? undefined,
      integrationCustomers: [
        ...(!!customer?.netsuiteCustomer ? [customer?.netsuiteCustomer] : []),
        ...(!!customer?.anrokCustomer ? [customer?.anrokCustomer] : []),
      ],
      paymentProviderCode: customer?.paymentProviderCode ?? undefined,
      providerCustomer: {
        providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? undefined,
        syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
        providerPaymentMethods: customer?.providerCustomer?.providerPaymentMethods?.length
          ? customer?.providerCustomer?.providerPaymentMethods
          : customer?.currency !== CurrencyEnum.Eur
            ? [ProviderPaymentMethodsEnum.Card]
            : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
      },
      paymentProvider: customer?.paymentProvider ?? undefined,
      metadata: customer?.metadata ?? undefined,
    },
    validationSchema: object().shape({
      name: string().required(''),
      email: string().email('text_620bc4d4269a55014d493fc3'),
      externalId: string().required(''),
      metadata: metadataSchema(),
      providerCustomer: object().test({
        test: function (value, { from }) {
          // Value can be undefined if no paymentProvider is selected
          if (value && from && from[1] && !from[1].value.paymentProvider) {
            return true
          }

          // if code is not selected, validation fails
          if (value && from && from[1] && !from[1].value.paymentProviderCode) {
            return false
          }

          return true
        },
      }),
      integrationCustomers: array()
        .of(
          object()
            .test({
              test: function (value: Omit<NetsuiteCustomer, 'id'> | Omit<AnrokCustomer, 'id'>) {
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
                  }
                }

                return true
              },
            })
            .nullable(),
        )
        .nullable(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
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
  const { timezoneConfig } = useOrganizationInfos()

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setCustomer(data)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  return (
    <Drawer
      ref={drawerRef}
      title={translate(
        isEdition
          ? 'text_632b4acf0c41206cbcb8c2f6'
          : customer?.name
            ? 'text_632b49e2620ea4c6d96c9650'
            : 'text_632b49e2620ea4c6d96c9652',
        {
          customerName: customer?.name || '',
        },
      )}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
    >
      <DrawerContent>
        <DrawerTitle>
          <Typography variant="headline">
            {translate(
              isEdition ? 'text_632b4acf0c41206cbcb8c2f8' : 'text_632b49e2620ea4c6d96c9652',
            )}
          </Typography>
          <Typography>
            {translate(
              isEdition ? 'text_632b4acf0c41206cbcb8c2fa' : 'text_632b49e2620ea4c6d96c9654',
            )}
          </Typography>
        </DrawerTitle>

        <Card>
          <Typography variant="subhead">{translate('text_626c0c09812bbc00e4c59df1')}</Typography>
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={!isEdition}
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
                    zone: timezoneConfig.name,
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
          <TextInputField
            name="externalSalesforceId"
            label={translate('text_651fd3f644384c00999fbd81')}
            placeholder={translate('text_651fd408a57493006d00504e')}
            helperText={translate('text_651fd41846f44c0064408b07')}
            formikProps={formikProps}
          />
        </Card>
        <Accordion
          size="large"
          summary={
            <Typography variant="subhead">{translate('text_632b49e2620ea4c6d96c9662')}</Typography>
          }
        >
          <AccordionContentWrapper $first>
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
          </AccordionContentWrapper>
          <AccordionContentWrapper>
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
              data={countryDataForCombobox}
              name="country"
              placeholder={translate('text_626c0c09812bbc00e4c59e27')}
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
            />
          </AccordionContentWrapper>
        </Accordion>

        {/* External apps */}
        <ExternalAppsAccordion formikProps={formikProps} isEdition={isEdition} />

        <Accordion
          size="large"
          summary={
            <Typography variant="subhead">{translate('text_63fcc3218d35b9377840f59b')}</Typography>
          }
        >
          <AccordionContentWrapper>
            <Typography variant="body" color="grey600">
              {translate('text_63fcc3218d35b9377840f59f')}
            </Typography>
            {!!formikProps?.values?.metadata?.length && (
              <div>
                <MetadataGrid $isHeader>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_63fcc3218d35b9377840f5a3')}
                  </Typography>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_63fcc3218d35b9377840f5ab')}
                  </Typography>
                  <Typography variant="captionHl" color="grey700">
                    {translate('text_63fcc3218d35b9377840f5b3')}
                  </Typography>
                </MetadataGrid>
                <MetadataGrid>
                  {formikProps?.values?.metadata?.map((m: LocalCustomerMetadata, i) => {
                    const metadataItemKeyError: FieldWithPossiblyUndefined<
                      string | undefined,
                      `${number}`
                    > = _get(formikProps.errors, `metadata.${i}.key`)
                    const metadataItemValueError: FieldWithPossiblyUndefined<
                      string | undefined,
                      `${number}`
                    > = _get(formikProps.errors, `metadata.${i}.value`)
                    const hasCustomKeyError = Object.keys(MetadataErrorsEnum).includes(
                      metadataItemKeyError || '',
                    )
                    const hasCustomValueError = Object.keys(MetadataErrorsEnum).includes(
                      metadataItemValueError || '',
                    )

                    return (
                      <React.Fragment key={`metadata-item-${m.id || m.localId || i}`}>
                        <Tooltip
                          placement="top-end"
                          title={
                            metadataItemKeyError === MetadataErrorsEnum.uniqueness
                              ? translate('text_63fcc3218d35b9377840f5dd')
                              : metadataItemKeyError === MetadataErrorsEnum.maxLength
                                ? translate('text_63fcc3218d35b9377840f5d9')
                                : undefined
                          }
                          disableHoverListener={!hasCustomKeyError}
                        >
                          <TextInputField
                            name={`metadata.${i}.key`}
                            silentError={!hasCustomKeyError}
                            placeholder={translate('text_63fcc3218d35b9377840f5a7')}
                            formikProps={formikProps}
                            displayErrorText={false}
                          />
                        </Tooltip>
                        <Tooltip
                          placement="top-end"
                          title={
                            metadataItemValueError === MetadataErrorsEnum.maxLength
                              ? translate('text_63fcc3218d35b9377840f5e5', {
                                  max: METADATA_VALUE_MAX_LENGTH_DEFAULT,
                                })
                              : undefined
                          }
                          disableHoverListener={!hasCustomValueError}
                        >
                          <TextInputField
                            name={`metadata.${i}.value`}
                            silentError={!hasCustomValueError}
                            placeholder={translate('text_63fcc3218d35b9377840f5af')}
                            formikProps={formikProps}
                            displayErrorText={false}
                          />
                        </Tooltip>
                        <Switch
                          name={`metadata.${i}.displayInInvoice`}
                          checked={
                            !!formikProps.values.metadata?.length &&
                            !!formikProps.values.metadata[i].displayInInvoice
                          }
                          onChange={(newValue) => {
                            formikProps.setFieldValue(`metadata.${i}.displayInInvoice`, newValue)
                          }}
                        />
                        <StyledTooltip
                          placement="top-end"
                          title={translate('text_63fcc3218d35b9377840f5e1')}
                        >
                          <Button
                            variant="quaternary"
                            size="small"
                            icon="trash"
                            onClick={() => {
                              formikProps.setFieldValue('metadata', [
                                ...(formikProps.values.metadata || []).filter((metadata, j) => {
                                  return j !== i
                                }),
                              ])
                            }}
                          />
                        </StyledTooltip>
                      </React.Fragment>
                    )
                  })}
                </MetadataGrid>
              </div>
            )}
            <Button
              startIcon="plus"
              variant="quaternary"
              disabled={(formikProps?.values?.metadata?.length || 0) >= MAX_METADATA_COUNT}
              onClick={() =>
                formikProps.setFieldValue('metadata', [
                  ...(formikProps.values.metadata || []),
                  {
                    key: '',
                    value: '',
                    displayInInvoice: false,
                    localId: Date.now(),
                  },
                ])
              }
              data-test="add-fixed-fee"
            >
              {translate('text_63fcc3218d35b9377840f5bb')}
            </Button>
          </AccordionContentWrapper>
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
              isEdition ? 'text_632b4acf0c41206cbcb8c30c' : 'text_632b49e2620ea4c6d96c9666',
            )}
          </Button>
        </DrawerSubmitButton>
      </DrawerContent>
    </Drawer>
  )
})

const AccordionContentWrapper = styled.div<{ $first?: boolean }>`
  margin-bottom: ${({ $first }) => ($first ? theme.spacing(6) : 0)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const MetadataGrid = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 200px 1fr 60px 24px;
  gap: ${theme.spacing(6)} ${theme.spacing(3)};

  ${({ $isHeader }) =>
    $isHeader &&
    css`
      margin-bottom: ${theme.spacing(1)};

      > div:nth-child(3) {
        grid-column: span 2;
      }
    `};
`

const StyledTooltip = styled(Tooltip)`
  display: flex;
  align-items: center;
`

AddCustomerDrawer.displayName = 'AddCustomerDrawer'
