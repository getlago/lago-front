import { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { DateTime } from 'luxon'
import { useNavigate } from 'react-router-dom'

import { Drawer, DrawerRef, Button, Alert, Typography } from '~/components/designSystem'
import { ComboBoxField, TextInputField, DatePicker, ButtonSelectorField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  updateOverwritePlanVar,
  overwritePlanVar,
  resetOverwritePlanVar,
  SubscriptionUpdateInfo,
} from '~/core/apolloClient'
import { theme, Card } from '~/styles'
import { CREATE_PLAN_ROUTE } from '~/core/router'
import { CreateSubscriptionInput, BillingTimeEnum, PlanInterval } from '~/generated/graphql'
import { useAddSubscription } from '~/hooks/customer/useAddSubscription'

export interface AddSubscriptionDrawerRef {
  openDialog: (existingSubscripiton?: SubscriptionUpdateInfo) => unknown
  closeDialog: () => unknown
}

interface AddSubscriptionDrawerProps {
  customerName: string
  customerId: string
}

export const AddSubscriptionDrawer = forwardRef<
  AddSubscriptionDrawerRef,
  AddSubscriptionDrawerProps
>(({ customerId, customerName }: AddSubscriptionDrawerProps, ref) => {
  const navigate = useNavigate()
  const drawerRef = useRef<DrawerRef>(null)
  const currentDateRef = useRef<DateTime>(DateTime.now())
  const [existingSubscripiton, setExistingSubscripiton] = useState<
    SubscriptionUpdateInfo | undefined
  >(undefined)
  const { translate } = useInternationalization()
  const formikProps = useFormik<Omit<CreateSubscriptionInput, 'customerId'>>({
    initialValues: {
      // @ts-ignore
      planId: undefined,
      name: '',
      billingTime: BillingTimeEnum.Calendar,
    },
    validationSchema: object().shape({
      planId: string().required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      const canClose = await onCreate(customerId, values)

      if (canClose) {
        drawerRef?.current?.closeDrawer()
        formikBag.resetForm()
      }
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
  } = useAddSubscription({
    existingSubscripiton,
    planId: formikProps.values.planId,
    billingTime: formikProps.values.billingTime,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setExistingSubscripiton(infos)
      drawerRef.current?.openDrawer()
    },
    closeDialog: () => drawerRef.current?.closeDrawer(),
  }))

  useEffect(() => {
    const { subscriptionInput, updateInfo } = overwritePlanVar()

    if (!!subscriptionInput) {
      const { planId, name, billingTime } = subscriptionInput

      formikProps.setValues({
        planId: planId || '',
        name: name || undefined,
        billingTime: billingTime || BillingTimeEnum.Calendar,
      })
      if (!!updateInfo) {
        setExistingSubscripiton({
          subscriptionId: updateInfo?.subscriptionId as string,
          existingPlanId: updateInfo?.existingPlanId as string,
          periodEndDate: updateInfo?.periodEndDate as string,
        })
      }
      resetOverwritePlanVar()
      drawerRef?.current?.openDrawer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Drawer
      ref={drawerRef}
      title={translate(
        existingSubscripiton ? 'text_6328e70de459381ed4ba50be' : 'text_6328e70de459381ed4ba50bc',
        { customerName }
      )}
      onClose={formikProps.resetForm}
      onOpen={onOpenDrawer}
    >
      <>
        <Content>
          <Title>
            <Typography variant="headline">
              {translate(
                existingSubscripiton
                  ? 'text_6328e70de459381ed4ba50c2'
                  : 'text_6328e70de459381ed4ba50c0',
                { customerName }
              )}
            </Typography>
            <Typography>
              {translate(
                existingSubscripiton
                  ? 'text_6328e70de459381ed4ba50c6'
                  : 'text_6328e70de459381ed4ba50c4'
              )}
            </Typography>
          </Title>

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
                loadingText={translate('text_625434c7bb2cb40124c81a35')}
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
                      parentId: formikProps?.values?.planId,
                      subscriptionInput: formikProps?.values,
                      customerId: customerId,
                      updateInfo: existingSubscripiton,
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
                <TextInputField
                  name="name"
                  formikProps={formikProps}
                  label={translate('text_62d7f6178ec94cd09370e2b9')}
                  placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
                  helperText={translate('text_62d7f6178ec94cd09370e2d9')}
                />
                {!existingSubscripiton && (
                  <>
                    <DatePicker
                      disabled
                      name="anniversaryDate"
                      value={currentDateRef?.current}
                      label={translate('text_62ea7cd44cd4b14bb9ac1dbb')}
                      onChange={() => {}}
                    />
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

            {!!errorCode ? (
              <Alert type="danger">{translate('text_632dbaf1d577afb32ae751f5')}</Alert>
            ) : (
              !!existingSubscripiton && (
                <Alert type="info">
                  {translate('text_6328e70de459381ed4ba50d6', {
                    subscriptionEndDate: DateTime.fromISO(
                      existingSubscripiton?.periodEndDate as string
                    ).toFormat('LLL. dd, yyyy'),
                  })}
                </Alert>
              )
            )}
          </Card>
        </Content>
        <SubmitButton>
          <Button
            size="large"
            fullWidth
            disabled={!formikProps.isValid}
            onClick={formikProps.submitForm}
            data-test="submit"
          >
            {existingSubscripiton
              ? translate('text_6328e70de459381ed4ba50da')
              : translate('text_6328e70de459381ed4ba50d4', { customerName })}
          </Button>
        </SubmitButton>
      </>
    </Drawer>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const Title = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const SubmitButton = styled.div`
  margin: 0 ${theme.spacing(8)};
`

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

AddSubscriptionDrawer.displayName = 'AddSubscriptionDrawer'
