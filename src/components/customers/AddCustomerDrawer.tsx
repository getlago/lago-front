import { useFormik } from 'formik'
import { FieldWithPossiblyUndefined } from 'lodash'
import _get from 'lodash/get'
import React, {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled, { css } from 'styled-components'
import { object, string } from 'yup'

import {
  Accordion,
  Alert,
  Button,
  Drawer,
  DrawerRef,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  BasicComboBoxData,
  Checkbox,
  ComboBoxField,
  Switch,
  TextInputField,
} from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { INTEGRATIONS_ROUTE, ORGANIZATION_INFORMATIONS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  METADATA_VALUE_MAX_LENGTH_DEFAULT,
  MetadataErrorsEnum,
  metadataSchema,
} from '~/formValidation/metadataSchema'
import {
  AddCustomerDrawerFragment,
  CreateCustomerInput,
  CurrencyEnum,
  CustomerMetadataInput,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  TimezoneEnum,
  UpdateCustomerInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { ITEM_HEIGHT } from '../form/ComboBox/ComboBoxItem'

const MAX_METADATA_COUNT = 5

const paymentProviderCodeEmptyTextLookup = {
  [ProviderTypeEnum.Stripe]: 'text_65940198687ce7b05cd62b64',
  [ProviderTypeEnum.Gocardless]: 'text_65940198687ce7b05cd62b65',
  [ProviderTypeEnum.Adyen]: 'text_65940198687ce7b05cd62b63',
}

export interface AddCustomerDrawerRef {
  openDrawer: (customer?: AddCustomerDrawerFragment | null) => unknown
  closeDrawer: () => unknown
}

interface LocalCustomerMetadata extends CustomerMetadataInput {
  localId?: string
}

const providerData: { value: ProviderTypeEnum; label: string }[] = Object.keys(
  ProviderTypeEnum,
).map((provider) => ({
  // @ts-ignore
  value: ProviderTypeEnum[provider],
  label: provider,
}))

export const AddCustomerDrawer = forwardRef<AddCustomerDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [customer, setCustomer] = useState<AddCustomerDrawerFragment | null | undefined>(null)
  const { isPremium } = useCurrentUser()
  const { isEdition, onSave, paymentProvidersList } = useCreateEditCustomer({
    customer,
  })

  const [isDisabled, setIsDisabled] = useState<boolean>(false)
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
  const connectedProvidersData: BasicComboBoxData[] | [] = useMemo(() => {
    if (!paymentProvidersList || !formikProps.values.paymentProvider) return []
    const localProvider = paymentProvidersList[formikProps.values.paymentProvider]

    if (!localProvider) return []

    return localProvider.map((provider) => ({
      value: provider.code,
      label: provider.name,
      labelNode: (
        <Item>
          <Typography color="grey700" noWrap>
            {provider.name}
          </Typography>
          &nbsp;
          <Typography color="textPrimary" noWrap>
            ({provider.code})
          </Typography>
        </Item>
      ),
    }))
  }, [formikProps.values.paymentProvider, paymentProvidersList])

  useEffect(() => {
    if (!formikProps.values.paymentProvider) {
      // If no payment provider, reset stripe customer
      formikProps.setFieldValue('providerCustomer.providerCustomerId', undefined)
      formikProps.setFieldValue('providerCustomer.syncWithProvider', false)
      formikProps.setFieldValue(
        'providerCustomer.providerPaymentMethods',
        formikProps.values.currency !== CurrencyEnum.Eur
          ? [ProviderPaymentMethodsEnum.Card]
          : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.paymentProvider])

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

        <Accordion
          size="large"
          summary={
            <Typography variant="subhead">{translate('text_632b49e2620ea4c6d96c9664')}</Typography>
          }
        >
          <AccordionContentWrapper>
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
            {!!formikProps.values.paymentProvider && (
              <>
                <ComboBoxField
                  data={connectedProvidersData}
                  name="paymentProviderCode"
                  label={translate('text_65940198687ce7b05cd62b61')}
                  placeholder={translate('text_65940198687ce7b05cd62b62')}
                  emptyText={translate(
                    paymentProviderCodeEmptyTextLookup[formikProps.values.paymentProvider],
                  )}
                  formikProps={formikProps}
                  PopperProps={{ displayInDialog: true }}
                />
                <TextInputField
                  name="providerCustomer.providerCustomerId"
                  disabled={isDisabled}
                  label={translate('text_62b328ead9a4caef81cd9ca0')}
                  placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                  formikProps={formikProps}
                />
                {!isEdition && (
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
                        ? ` • ${connectedProvidersData.find(
                            (provider) => provider.value === formikProps.values.paymentProviderCode,
                          )?.label}`
                        : ''
                    }`}
                    onChange={(e, checked) => {
                      setIsDisabled(checked)
                      formikProps.setFieldValue('providerCustomer.syncWithProvider', checked)
                      if (!isEdition && checked) {
                        formikProps.setFieldValue('providerCustomer.providerCustomerId', undefined)
                      }
                    }}
                  />
                )}

                {formikProps.values.paymentProvider === ProviderTypeEnum.Stripe && (
                  <StripePaymentMethodWrapper>
                    <Typography variant="captionHl" color="grey700">
                      {translate('text_64aeb7b998c4322918c84204')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_64aeb7b998c4322918c84210')}
                    </Typography>
                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.card"
                      value={
                        !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                          ProviderPaymentMethodsEnum.Card,
                        )
                      }
                      label={translate('text_64aeb7b998c4322918c84208')}
                      disabled={
                        formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                        formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                          ProviderPaymentMethodsEnum.Card,
                        )
                      }
                      onChange={(e, checked) => {
                        const newValue = [
                          ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
                        ]

                        if (checked) {
                          newValue.push(ProviderPaymentMethodsEnum.Card)
                        } else {
                          newValue.splice(newValue.indexOf(ProviderPaymentMethodsEnum.Card), 1)
                        }

                        formikProps.setFieldValue(
                          'providerCustomer.providerPaymentMethods',
                          newValue,
                        )
                      }}
                    />
                    <Checkbox
                      name="providerCustomer.providerPaymentMethods.sepa_debit"
                      value={
                        !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                          ProviderPaymentMethodsEnum.SepaDebit,
                        )
                      }
                      label={translate('text_64aeb7b998c4322918c8420c')}
                      sublabel={
                        formikProps.values.currency !== CurrencyEnum.Eur &&
                        translate('text_64b04d6b13f1cc00ab4bf6bf')
                      }
                      disabled={
                        formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
                        formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                          ProviderPaymentMethodsEnum.SepaDebit,
                        )
                      }
                      onChange={(e, checked) => {
                        const newValue = [
                          ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
                        ]

                        if (checked) {
                          newValue.push(ProviderPaymentMethodsEnum.SepaDebit)
                        } else {
                          newValue.splice(newValue.indexOf(ProviderPaymentMethodsEnum.SepaDebit), 1)
                        }

                        formikProps.setFieldValue(
                          'providerCustomer.providerPaymentMethods',
                          newValue,
                        )
                      }}
                    />

                    <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
                  </StripePaymentMethodWrapper>
                )}
              </>
            )}
            {isDisabled &&
              (formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless ||
                formikProps.values.paymentProvider === ProviderTypeEnum.Adyen) && (
                <Alert type="info">
                  {formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                    ? translate('text_635bdbda84c98758f9bba8ae')
                    : translate('text_645d0728ea0a5a7bbf76d5c9')}
                </Alert>
              )}
          </AccordionContentWrapper>
        </Accordion>

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

const HelperText = styled(Typography)`
  font-size: 14px;
  line-height: 20px;
`

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

const StripePaymentMethodWrapper = styled.div`
  display: flex;
  flex-direction: column;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }

  > *:last-child {
    margin-top: ${theme.spacing(6)};
  }
`

const Item = styled.div`
  min-height: ${ITEM_HEIGHT}px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
`

AddCustomerDrawer.displayName = 'AddCustomerDrawer'
