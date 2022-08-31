import { forwardRef, useEffect, RefObject, useState } from 'react'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import _omit from 'lodash/omit'

import { Dialog, Button, DialogRef, Typography, Tooltip, Skeleton } from '~/components/designSystem'
import { TextInputField, ComboBoxField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { LagoGQLError } from '~/core/apolloClient'
import { theme } from '~/styles'
import {
  AddCustomerDialogFragment,
  AddCustomerDialogDetailFragment,
  CreateCustomerInput,
  UpdateCustomerInput,
  Lago_Api_Error,
  ProviderTypeEnum,
} from '~/generated/graphql'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import CountryCodes from '~/public/countryCode.json'

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

export interface AddCustomerDialogRef extends DialogRef {}

interface AddCustomerDialogProps {
  customer?: AddCustomerDialogFragment | AddCustomerDialogDetailFragment | null
}

export const AddCustomerDialog = forwardRef<DialogRef, AddCustomerDialogProps>(
  ({ customer }: AddCustomerDialogProps, ref) => {
    const { translate } = useInternationalization()
    const { isEdition, loading, billingInfos, onSave, loadBillingInfos } = useCreateEditCustomer({
      customer,
    })
    const [isCollapsed, setIsCollapsed] = useState(!isEdition)
    const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
      initialValues: {
        name: '',
        externalId: '',
        legalName: undefined,
        legalNumber: undefined,
        email: undefined,
        phone: undefined,
        url: undefined,
        logoUrl: undefined,
        addressLine1: undefined,
        addressLine2: undefined,
        zipcode: undefined,
        city: undefined,
        state: undefined,
        country: undefined,
        paymentProvider: undefined,
        stripeCustomer: undefined,
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
        const error = !errors ? undefined : (errors[0]?.extensions as LagoGQLError['extensions'])

        if (
          !!error &&
          error?.code === Lago_Api_Error.UnprocessableEntity &&
          !!error?.details?.externalId
        ) {
          formikBag.setFieldError('externalId', translate('text_626162c62f790600f850b728'))
        } else {
          ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
          !isEdition && formikBag.resetForm()
          setIsCollapsed(!isEdition)
        }
      },
    })

    useEffect(() => {
      setIsCollapsed(!isEdition)
      formikProps.setValues({
        name: customer?.name ?? '',
        externalId: customer?.externalId ?? '',
        legalName: customer?.legalName ?? undefined,
        legalNumber: customer?.legalNumber ?? undefined,
        phone: customer?.phone ?? undefined,
        email: customer?.email ?? undefined,
        logoUrl: customer?.logoUrl ?? undefined,
        url: customer?.url ?? undefined,
        addressLine1: customer?.addressLine1 ?? undefined,
        addressLine2: customer?.addressLine2 ?? undefined,
        state: customer?.state ?? undefined,
        country: customer?.country ?? undefined,
        city: customer?.city ?? undefined,
        zipcode: customer?.zipcode ?? undefined,
        stripeCustomer: customer?.stripeCustomer ?? undefined,
        paymentProvider: customer?.paymentProvider ?? undefined,
        ..._omit(billingInfos, ['id']),
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer, billingInfos])

    useEffect(() => {
      if (!formikProps.values.paymentProvider) {
        // If no payment provider, reset stripe customer
        formikProps.setFieldValue('stripeCustomer.providerCustomerId', null)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formikProps.values.paymentProvider])

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_6261712bff79eb00ed02906f' : 'text_624efab67eb2570101d117ad'
        )}
        onOpen={() => {
          isEdition && loadBillingInfos && loadBillingInfos()
        }}
        description={!isEdition && translate('text_624efab67eb2570101d117b5')}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={() => {
                closeDialog()
                setIsCollapsed(!isEdition)

                formikProps.resetForm({
                  values: {
                    name: customer?.name ?? '',
                    externalId: customer?.externalId ?? '',
                    legalName: undefined,
                    legalNumber: undefined,
                    phone: undefined,
                    email: undefined,
                    logoUrl: undefined,
                    url: undefined,
                    addressLine1: undefined,
                    addressLine2: undefined,
                    state: undefined,
                    country: undefined,
                    city: undefined,
                    zipcode: undefined,
                    stripeCustomer: undefined,
                    paymentProvider: undefined,
                    ..._omit(billingInfos, 'id'),
                  },
                })
              }}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
              loading={formikProps.isSubmitting}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_6261712bff79eb00ed02907b' : 'text_624efab67eb2570101d117eb'
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <Typography variant="subhead">{translate('text_626c0c09812bbc00e4c59df1')}</Typography>
          <TextInputField
            name="name"
            label={translate('text_624efab67eb2570101d117be')}
            placeholder={translate('text_624efab67eb2570101d117c6')}
            formikProps={formikProps}
          />
          <CustomerId
            name="externalId"
            disabled={isEdition && !customer?.canBeDeleted}
            label={translate('text_624efab67eb2570101d117ce')}
            placeholder={translate('text_624efab67eb2570101d117d6')}
            helperText={
              (!isEdition || customer?.canBeDeleted) && translate('text_624efab67eb2570101d117de')
            }
            formikProps={formikProps}
          />
          <div>
            <BillinInfoLine onClick={() => setIsCollapsed((prev) => !prev)}>
              <Typography variant="subhead">
                {translate('text_626c0c09812bbc00e4c59dfd')}
              </Typography>
              <Tooltip
                placement="top-end"
                title={translate(
                  isCollapsed ? 'text_626c0c6c93d2b600a73fc7b8' : 'text_626c0c09812bbc00e4c59e5d'
                )}
              >
                <CollapseButton
                  $expanded={!isCollapsed}
                  size="small"
                  variant="quaternary"
                  icon="chevron-right"
                />
              </Tooltip>
            </BillinInfoLine>
            <BillingInfos $visible={!isCollapsed}>
              {loading ? (
                <Skeleton variant="text" width={240} height={12} />
              ) : (
                <>
                  <BillingBlock $first>
                    <Typography variant="bodyHl" color="textSecondary">
                      {translate('text_626c0c09812bbc00e4c59dff')}
                    </Typography>
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
                    <TextInputField
                      name="url"
                      label={translate('text_626c0c09812bbc00e4c59e11')}
                      placeholder={translate('text_626c0c09812bbc00e4c59e13')}
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="logoUrl"
                      label={translate('text_626c0c09812bbc00e4c59e15')}
                      placeholder={translate('text_626c0c09812bbc00e4c59e17')}
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
                  <BillingBlock>
                    <Typography variant="bodyHl" color="textSecondary">
                      {translate('text_62b328ead9a4caef81cd9c9a')}
                    </Typography>
                    <ComboBoxField
                      data={providerData}
                      name="paymentProvider"
                      label={translate('text_62b328ead9a4caef81cd9c9c')}
                      placeholder={translate('text_62b328ead9a4caef81cd9c9e')}
                      formikProps={formikProps}
                      PopperProps={{ displayInDialog: true }}
                    />
                    <TextInputField
                      name="stripeCustomer.providerCustomerId"
                      label={translate('text_62b328ead9a4caef81cd9ca0')}
                      placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                      formikProps={formikProps}
                    />
                  </BillingBlock>
                </>
              )}
            </BillingInfos>
          </div>
        </Content>
      </Dialog>
    )
  }
)

const CustomerId = styled(TextInputField)`
  margin-bottom: ${theme.spacing(8)};
`

const BillinInfoLine = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(8)};

    &:first-child {
      margin-bottom: ${theme.spacing(6)};
    }
  }
`

const BillingInfos = styled.div<{ $visible: boolean }>`
  margin-top: ${({ $visible }) => ($visible ? theme.spacing(6) : 0)};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: ${({ $visible }) => ($visible ? '10000px' : '0px')};
  overflow: ${({ $visible }) => ($visible ? 'unset' : 'hidden')};
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ $visible }) => ($visible ? theme.spacing(3) : 0)};

  > * {
    flex: 1;
  }
`

const CollapseButton = styled(Button)<{ $expanded: boolean }>`
  svg {
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    transform: ${({ $expanded }) => ($expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
  }
`

const BillingBlock = styled.div<{ $first?: boolean }>`
  margin-bottom: ${({ $first }) => ($first ? theme.spacing(6) : 0)};

  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

AddCustomerDialog.displayName = 'AddCustomerDialog'
