import { forwardRef, useState, useImperativeHandle, useRef, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { DateTime } from 'luxon'
import { useNavigate } from 'react-router-dom'

import { Drawer, DrawerRef, Button, Alert, Typography } from '~/components/designSystem'
import {
  ComboBoxField,
  TextInputField,
  DatePickerField,
  ButtonSelectorField,
  TextInput,
} from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  updateOverwritePlanVar,
  overwritePlanVar,
  resetOverwritePlanVar,
  SubscriptionUpdateInfo,
} from '~/core/apolloClient'
import { theme, Card, DrawerTitle, DrawerContent, DrawerSubmitButton } from '~/styles'
import { CREATE_PLAN_ROUTE } from '~/core/router'
import {
  CreateSubscriptionInput,
  BillingTimeEnum,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
  LagoApiError,
} from '~/generated/graphql'
import { useAddSubscription } from '~/hooks/customer/useAddSubscription'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { TimeZonesConfig, getTimezoneConfig } from '~/core/timezone'
import { TimePickerField } from '~/components/form/TimePicker'

export interface AddSubscriptionDrawerRef {
  openDialog: (existingSubscription?: SubscriptionUpdateInfo) => unknown
  closeDialog: () => unknown
}

interface AddSubscriptionDrawerProps {
  customerName: string
  customerId: string
  customerTimezone?: TimezoneEnum | null
}

export const AddSubscriptionDrawer = forwardRef<
  AddSubscriptionDrawerRef,
  AddSubscriptionDrawerProps
>(({ customerId, customerName, customerTimezone }: AddSubscriptionDrawerProps, ref) => {
  const navigate = useNavigate()
  const drawerRef = useRef<DrawerRef>(null)
  const {
    timezone: organizationTimezone,
    timezoneConfig: orgaTimezoneConfig,
    formatTimeOrgaTZ,
  } = useOrganizationInfos()
  const customerTimezoneConfig = getTimezoneConfig(customerTimezone)
  const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
  const currentDateRef = useRef<string>(DateTime.now().setZone(GMT).toISO())

  const [existingSubscription, setExistingSubscription] = useState<
    SubscriptionUpdateInfo | undefined
  >(undefined)
  const { translate } = useInternationalization()
  const formikProps = useFormik<Omit<CreateSubscriptionInput, 'customerId'>>({
    initialValues: {
      // @ts-ignore
      planId: undefined,
      name: '',
      externalId: '',
      subscriptionAt: currentDateRef?.current,
      billingTime: BillingTimeEnum.Calendar,
    },
    validationSchema: object().shape({
      planId: string().required(''),
      subscriptionAt: string().required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      const errorsString = await onCreate(customerId, values)

      if (errorsString === 'CurrenciesDoesNotMatch') {
        return formikBag.setFieldError('currency', translate('text_632dbaf1d577afb32ae751f5'))
      } else if (errorsString === 'ValueAlreadyExist') {
        return formikBag.setFieldError('externalId', translate('text_64dd2711d878ad007212de91'))
      }

      drawerRef?.current?.closeDrawer()
      formikBag.resetForm()
    },
  })
  const {
    loading,
    selectedPlan,
    comboboxPlansData,
    billingTimeHelper,
    errorCode,
    onCreate,
    onOpenDrawer,
    getPlans,
  } = useAddSubscription({
    existingSubscription,
    planId: formikProps.values.planId ? String(formikProps.values.planId) : '',
    billingTime: formikProps.values.billingTime,
    subscriptionAt: formikProps.values.subscriptionAt,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setExistingSubscription(infos)
      drawerRef.current?.openDrawer()
    },
    closeDialog: () => drawerRef.current?.closeDrawer(),
  }))

  useEffect(() => {
    const { subscriptionInput, updateInfo } = overwritePlanVar()

    if (!!subscriptionInput) {
      const { planId, name, billingTime, subscriptionAt } = subscriptionInput

      formikProps.setValues({
        subscriptionAt: subscriptionAt || currentDateRef?.current,
        planId: planId || '',
        name: name || undefined,
        billingTime: billingTime || BillingTimeEnum.Calendar,
      })
      if (!!updateInfo) {
        setExistingSubscription({
          subscriptionId: updateInfo?.subscriptionId as string,
          existingPlanId: updateInfo?.existingPlanId as string,
          periodEndDate: updateInfo?.periodEndDate as string,
          status: updateInfo?.status,
        })
      }
      resetOverwritePlanVar()
      drawerRef?.current?.openDrawer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subscriptionAtHelperText = useMemo(() => {
    if (
      !formikProps.values.subscriptionAt ||
      (customerTimezoneConfig?.offsetInMinute === 0 && orgaTimezoneConfig.offsetInMinute === 0)
    )
      return undefined

    if (formikProps.values.subscriptionAt) {
      if (!!customerTimezone) {
        const date = DateTime.fromISO(formikProps.values.subscriptionAt)
          .setZone(customerTimezoneConfig.name)
          .toFormat('LLL. dd, yyyy')
        const time = `${DateTime.fromISO(formikProps.values.subscriptionAt)
          .setZone(customerTimezoneConfig.name)
          .setLocale('en')
          .toFormat('t')}`
        const offset = TimeZonesConfig[customerTimezone].offset

        if (customerTimezoneConfig?.offsetInMinute < 0) {
          return translate('text_648b280da2ff5a00723b6b88', { date, time, offset })
        } else if (customerTimezoneConfig?.offsetInMinute > 0) {
          return translate('text_648b280da2ff5a00723b6b88', { date, time, offset })
        }
      } else if (!!organizationTimezone) {
        const date = DateTime.fromISO(formikProps.values.subscriptionAt)
          .setZone(orgaTimezoneConfig.name)
          .toFormat('LLL. dd, yyyy')
        const time = `${DateTime.fromISO(formikProps.values.subscriptionAt)
          .setZone(orgaTimezoneConfig.name)
          .setLocale('en')
          .toFormat('t')}`
        const offset = TimeZonesConfig[organizationTimezone].offset

        if (orgaTimezoneConfig.offsetInMinute < 0) {
          return translate('text_648b280da2ff5a00723b6b88', { date, time, offset })
        } else if (orgaTimezoneConfig.offsetInMinute > 0) {
          return translate('text_648b280da2ff5a00723b6b88', { date, time, offset })
        }
      }
    }

    return undefined
  }, [
    organizationTimezone,
    customerTimezone,
    customerTimezoneConfig,
    formikProps.values.subscriptionAt,
    orgaTimezoneConfig,
    translate,
  ])

  return (
    <Drawer
      ref={drawerRef}
      title={translate(
        existingSubscription ? 'text_6328e70de459381ed4ba50be' : 'text_6328e70de459381ed4ba50bc',
        { customerName }
      )}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      onOpen={() => {
        onOpenDrawer()
        formikProps.validateForm()
      }}
    >
      <>
        <DrawerContent>
          <DrawerTitle>
            <Typography variant="headline" forceBreak>
              {translate(
                existingSubscription
                  ? 'text_6328e70de459381ed4ba50c2'
                  : 'text_6328e70de459381ed4ba50c0',
                { customerName }
              )}
            </Typography>
            <Typography>
              {translate(
                existingSubscription
                  ? 'text_6328e70de459381ed4ba50c6'
                  : 'text_6328e70de459381ed4ba50c4'
              )}
            </Typography>
          </DrawerTitle>

          <Card>
            <Typography variant="subhead">{translate('text_6328e70de459381ed4ba50ca')}</Typography>
            <PlanBlock>
              <ComboBoxField
                name="planId"
                formikProps={formikProps}
                label={translate('text_625434c7bb2cb40124c81a29')}
                data={comboboxPlansData}
                loading={loading}
                isEmptyNull={false}
                searchQuery={getPlans}
                placeholder={translate('text_625434c7bb2cb40124c81a31')}
                emptyText={translate('text_625434c7bb2cb40124c81a37')}
                PopperProps={{ displayInDialog: true }}
              />
              {!!formikProps?.values?.planId && (
                <Button
                  variant="quaternary"
                  startIcon="pen"
                  size="large"
                  onClick={() => {
                    updateOverwritePlanVar({
                      parentId: formikProps.values.planId ? String(formikProps.values.planId) : '',
                      subscriptionInput: formikProps?.values,
                      customerId: customerId,
                      updateInfo: existingSubscription,
                    })
                    navigate(CREATE_PLAN_ROUTE)
                  }}
                >
                  {translate('text_6328e911e1eede3a429e8861')}
                </Button>
              )}
            </PlanBlock>
            {!!formikProps?.values?.planId && (
              <>
                {!existingSubscription ? (
                  <TextInputField
                    name="externalId"
                    formikProps={formikProps}
                    label={translate('text_642a94e522316cd9e1875224')}
                    placeholder={translate('text_642ac1d1407baafb9e4390ee')}
                    helperText={translate('text_642ac28c65c2180085afe31a')}
                  />
                ) : (
                  (!!existingSubscription?.subscriptionExternalId ||
                    !!formikProps.values.externalId) && (
                    <TextInput
                      disabled
                      label={translate('text_642a94e522316cd9e1875224')}
                      value={
                        formikProps.values.externalId ||
                        existingSubscription?.subscriptionExternalId
                      }
                    />
                  )
                )}

                <TextInputField
                  name="name"
                  formikProps={formikProps}
                  label={translate('text_62d7f6178ec94cd09370e2b9')}
                  placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                  helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                />

                {!existingSubscription && (
                  <>
                    <div>
                      <InlineFields>
                        <DatePickerField
                          name="subscriptionAt"
                          label={translate('text_648b1828ead1c3004b930334')}
                          defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                          formikProps={formikProps}
                        />
                        <TimePickerField
                          name="subscriptionAt"
                          label={translate('text_648b1837da6496008dfe4b3c')}
                          defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                          formikProps={formikProps}
                        />
                      </InlineFields>
                      {!!subscriptionAtHelperText && (
                        <InlineFieldsHelperText variant="caption" color="grey600">
                          {subscriptionAtHelperText}
                        </InlineFieldsHelperText>
                      )}
                    </div>
                    <ButtonSelectorField
                      name="billingTime"
                      label={translate('text_62ea7cd44cd4b14bb9ac1db7')}
                      formikProps={formikProps}
                      helperText={billingTimeHelper}
                      options={[
                        {
                          label:
                            selectedPlan?.interval === PlanInterval.Yearly
                              ? translate('text_62ebd597d5d5130a03ced107')
                              : selectedPlan?.interval === PlanInterval.Weekly
                              ? translate('text_62ebd597d5d5130a03ced101')
                              : selectedPlan?.interval === PlanInterval.Quarterly
                              ? translate('text_64d6357b00dea100ad1cba27')
                              : translate('text_62ea7cd44cd4b14bb9ac1db9'),
                          value: BillingTimeEnum.Calendar,
                        },
                        {
                          label: translate('text_62ea7cd44cd4b14bb9ac1dbb'),
                          value: BillingTimeEnum.Anniversary,
                        },
                      ]}
                    />
                  </>
                )}
              </>
            )}

            {errorCode === LagoApiError.CurrenciesDoesNotMatch ? (
              <Alert type="danger">{translate('text_632dbaf1d577afb32ae751f5')}</Alert>
            ) : (
              <>
                {existingSubscription?.status === StatusTypeEnum.Active && (
                  <Alert type="info">
                    {translate('text_6328e70de459381ed4ba50d6', {
                      subscriptionEndDate: formatTimeOrgaTZ(
                        existingSubscription?.periodEndDate as string
                      ),
                    })}
                  </Alert>
                )}
                {existingSubscription?.status === StatusTypeEnum.Pending && (
                  <Alert type="info">
                    {translate('text_6335e50b0b089e1d8ed508da', {
                      subscriptionAt: formatTimeOrgaTZ(existingSubscription?.startDate as string),
                    })}
                  </Alert>
                )}
              </>
            )}
          </Card>

          <DrawerSubmitButton>
            <Button
              size="large"
              fullWidth
              disabled={!formikProps.isValid}
              onClick={formikProps.submitForm}
              data-test="submit"
            >
              <Typography color="inherit" noWrap>
                {existingSubscription
                  ? translate('text_6328e70de459381ed4ba50da')
                  : translate('text_6328e70de459381ed4ba50d4', { customerName })}
              </Typography>
            </Button>
          </DrawerSubmitButton>
        </DrawerContent>
      </>
    </Drawer>
  )
})

const PlanBlock = styled.div`
  display: flex;
  align-items: flex-end;

  > *:first-child {
    flex: 1;
  }

  > *:first-child:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const InlineFields = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }

  > *:last-child {
    flex: 1;
    max-width: 192px;
  }
`

const InlineFieldsHelperText = styled(Typography)`
  margin-top: ${theme.spacing(1)};
`

AddSubscriptionDrawer.displayName = 'AddSubscriptionDrawer'
