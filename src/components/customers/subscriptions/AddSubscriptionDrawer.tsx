import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Alert, Button, Drawer, DrawerRef, Icon, Typography } from '~/components/designSystem'
import {
  ButtonSelectorField,
  ComboBoxField,
  DatePickerField,
  TextInput,
  TextInputField,
} from '~/components/form'
import {
  duplicatePlanVar,
  resetDuplicatePlanVar,
  SubscriptionUpdateInfo,
  updateDuplicatePlanVar,
} from '~/core/apolloClient'
import { dateErrorCodes } from '~/core/constants/form'
import { CREATE_PLAN_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import {
  BillingTimeEnum,
  CreateSubscriptionInput,
  LagoApiError,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAddSubscription } from '~/hooks/customer/useAddSubscription'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { SubscriptionDatesOffsetHelperComponent } from './SubscriptionDatesOffsetHelperComponent'

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
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const GMT = getTimezoneConfig(TimezoneEnum.TzUtc).name
  const currentDateRef = useRef<string>(DateTime.now().setZone(GMT).startOf('day').toISO())

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
      subscriptionAt: existingSubscription?.startDate || currentDateRef?.current,
      endingAt: existingSubscription?.endDate || undefined,
      billingTime: BillingTimeEnum.Calendar,
    },
    validationSchema: object().shape({
      planId: string().required(''),
      subscriptionAt: string().required(''),
      endingAt: string()
        .test({
          test: function (value, { from, path }) {
            // Value can be undefined
            if (!value) {
              return true
            }

            // Make sure value has correct format
            if (!DateTime.fromISO(value).isValid) {
              return this.createError({
                path,
                message: dateErrorCodes.wrongFormat,
              })
            }

            // If subscription at is present
            if (from && from[0] && from[0].value && from[0].value.subscriptionAt) {
              const subscriptionAt = DateTime.fromISO(from[0].value.subscriptionAt)
              const endingAt = DateTime.fromISO(value)

              // Make sure endingAt is set later than subscriptionAt and in the future
              if (endingAt <= subscriptionAt || DateTime.now().diff(endingAt, 'days').days >= 0) {
                return this.createError({
                  path,
                  message: dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt,
                })
              }
            }

            return true
          },
        })
        .nullable(),
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
    const { subscriptionInput, updateInfo } = duplicatePlanVar()

    if (!!subscriptionInput) {
      const { planId, name, billingTime, subscriptionAt, endingAt } = subscriptionInput

      formikProps.setValues({
        subscriptionAt: subscriptionAt || currentDateRef?.current,
        endingAt: endingAt || undefined,
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
      resetDuplicatePlanVar()
      drawerRef?.current?.openDrawer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                    updateDuplicatePlanVar({
                      type: 'override',
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
                )}

                <div>
                  <InlineFields>
                    <DatePickerField
                      disabled={
                        !!existingSubscription && !!formikProps.initialValues.subscriptionAt
                      }
                      name="subscriptionAt"
                      label={translate('text_64ef55a730b88e3d2117b3c4')}
                      defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                      placement="auto"
                      formikProps={formikProps}
                    />
                    <InlineFieldsIcon name="arrow-right" />
                    <DatePickerField
                      disablePast
                      name="endingAt"
                      label={translate('text_64ef55a730b88e3d2117b3cc')}
                      defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
                      formikProps={formikProps}
                      placement="auto"
                      error={
                        formikProps.errors.endingAt ===
                        dateErrorCodes.shouldBeFutureAndBiggerThanSubscriptionAt
                          ? translate('text_64ef55a730b88e3d2117b3d4')
                          : undefined
                      }
                      inputProps={{ cleanable: true }}
                    />
                  </InlineFields>

                  {!formikProps.errors.endingAt && !formikProps.errors.subscriptionAt && (
                    <LocalSubscriptionDatesOffsetHelperComponent
                      customerTimezone={customerTimezone}
                      subscriptionAt={formikProps.values.subscriptionAt}
                      endingAt={formikProps.values.endingAt}
                    />
                  )}
                </div>
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

  > *:first-child,
  > *:last-child {
    flex: 1;
  }
`

const InlineFieldsIcon = styled(Icon)`
  margin-top: ${theme.spacing(10)};
`

const LocalSubscriptionDatesOffsetHelperComponent = styled(SubscriptionDatesOffsetHelperComponent)`
  margin-top: ${theme.spacing(1)};
`

AddSubscriptionDrawer.displayName = 'AddSubscriptionDrawer'
