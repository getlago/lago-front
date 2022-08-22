import { forwardRef, useMemo, RefObject, useState, useImperativeHandle, useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { DateTime } from 'luxon'

import { Dialog, Button, DialogRef, Alert, Typography } from '~/components/designSystem'
import { ComboBoxField, TextInputField, DatePicker, ButtonSelectorField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast, LagoGQLError } from '~/core/apolloClient'
import { theme } from '~/styles'
import {
  useCreateSubscriptionMutation,
  CustomerSubscriptionListFragmentDoc,
  useGetPlansLazyQuery,
  CreateSubscriptionInput,
  Lago_Api_Error,
  PlanInterval,
  BillingTimeEnum,
} from '~/generated/graphql'

export interface AddPlanToCustomerDialogRef {
  openDialog: (existingInfos?: { subscriptionId: string; existingPlanId: string }) => unknown
  closeDialog: () => unknown
}

gql`
  query getPlans($page: Int, $limit: Int) {
    plans(page: $page, limit: $limit) {
      collection {
        id
        name
        code
        interval
      }
    }
  }

  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      ...CustomerSubscriptionList
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
`

interface AddPlanToCustomerDialogProps {
  customerName: string
  customerId: string
}

export const AddPlanToCustomerDialog = forwardRef<
  AddPlanToCustomerDialogRef,
  AddPlanToCustomerDialogProps
>(({ customerId, customerName }: AddPlanToCustomerDialogProps, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const currentDateRef = useRef<DateTime>(DateTime.now())
  const [existingInfos, setExistingInfos] = useState<
    | {
        subscriptionId: string
        existingPlanId: string
      }
    | undefined
  >(undefined)
  const { translate } = useInternationalization()
  const [getPlans, { loading, data }] = useGetPlansLazyQuery()
  const [create] = useCreateSubscriptionMutation({
    context: {
      silentErrorCodes: [Lago_Api_Error.CurrenciesDoesNotMatch],
    },
    onCompleted: async ({ createSubscription }) => {
      if (!!createSubscription) {
        addToast({
          message: existingInfos
            ? translate('text_62d7f6178ec94cd09370e69a')
            : translate('text_62544f170d205200f09d5938'),
          severity: 'success',
        })
      }
    },
  })
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
      const answer = await create({
        variables: {
          input: {
            customerId,
            ...(existingInfos ? { subscriptionId: existingInfos.subscriptionId } : {}),
            ...values,
          },
        },
        refetchQueries: ['getCustomer'],
      })

      const { errors } = answer
      const apiError = !errors ? undefined : (errors[0]?.extensions as LagoGQLError['extensions'])

      if (!!apiError && apiError?.code === Lago_Api_Error.CurrenciesDoesNotMatch) {
        formikBag.setFieldError('planId', translate('text_62d904d38619b00b6681a3c6'))
      } else {
        ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
        formikBag.resetForm()
      }
    },
  })
  const comboboxPlansData = useMemo(() => {
    if (!data || !data?.plans || !data?.plans?.collection) return []

    return data?.plans?.collection.map(({ id, name, code }) => {
      return {
        label: `${name} - (${code})`,
        labelNode: (
          <PlanItem>
            {name} <Typography color="textPrimary">({code})</Typography>
          </PlanItem>
        ),
        value: id,
        disabled: !!existingInfos?.existingPlanId && existingInfos?.existingPlanId === id,
      }
    })
  }, [data, existingInfos?.existingPlanId])

  const selectedPlan = useMemo(() => {
    if (!data?.plans?.collection || !formikProps.values.planId) return undefined

    return (data?.plans?.collection || []).find((plan) => plan.id === formikProps.values.planId)
  }, [data?.plans, formikProps.values.planId])

  const billingTimeHelper = useMemo(() => {
    const billingTime = formikProps.values.billingTime
    const currentDate = DateTime.now().setLocale('en-gb')
    const formattedCurrentDate = currentDate.toFormat('LL/dd/yyyy')
    const february29 = '02/29/2020'
    const currentDay = currentDate.get('day')

    if (!selectedPlan) return undefined

    switch (selectedPlan?.interval) {
      case PlanInterval.Monthly:
        if (billingTime === BillingTimeEnum.Calendar)
          return translate('text_62ea7cd44cd4b14bb9ac1d7e')

        if (currentDay <= 28) {
          return translate('text_62ea7cd44cd4b14bb9ac1d82', { day: currentDay })
        } else if (currentDay === 29) {
          return translate('text_62ea7cd44cd4b14bb9ac1d86')
        } else if (currentDay === 30) {
          return translate('text_62ea7cd44cd4b14bb9ac1d8a')
        }
        return translate('text_62ea7cd44cd4b14bb9ac1d8e')

      case PlanInterval.Yearly:
        return billingTime === BillingTimeEnum.Calendar
          ? translate('text_62ea7cd44cd4b14bb9ac1d92')
          : formattedCurrentDate === february29
          ? translate('text_62ea7cd44cd4b14bb9ac1d9a')
          : translate('text_62ea7cd44cd4b14bb9ac1d96', { date: currentDate.toFormat('LLL. dd') })

      case PlanInterval.Weekly:
      default:
        return billingTime === BillingTimeEnum.Calendar
          ? translate('text_62ea7cd44cd4b14bb9ac1d9e')
          : translate('text_62ea7cd44cd4b14bb9ac1da2', { day: currentDate.weekdayLong })
    }
  }, [selectedPlan, formikProps.values.billingTime, translate])

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setExistingInfos(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(
        existingInfos ? 'text_62559eef7b0ccc015127e38b' : 'text_625434c7bb2cb40124c81a19',
        { customerName }
      )}
      onClickAway={() => formikProps.resetForm()}
      description={translate(
        existingInfos ? 'text_62559eef7b0ccc015127e38d' : 'text_625434c7bb2cb40124c81a21'
      )}
      onOpen={() => {
        if (!loading) {
          getPlans()
        }
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_6244277fe0975300fe3fb94a')}
          </Button>
          <Button disabled={!formikProps.isValid} onClick={formikProps.submitForm}>
            {translate(
              existingInfos ? 'text_62559eef7b0ccc015127e3a1' : 'text_625434c7bb2cb40124c81a41'
            )}
          </Button>
        </>
      )}
    >
      <Content>
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
          <>
            <TextInputField
              name="name"
              formikProps={formikProps}
              label={translate('text_62d7f6178ec94cd09370e2b9')}
              placeholder={translate('text_62d7f6178ec94cd09370e2cb')}
              helperText={translate('text_62d7f6178ec94cd09370e2d9')}
            />
            {!existingInfos && (
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

        {!!formikProps.errors.planId ? (
          <Alert type="danger">{formikProps.errors.planId}</Alert>
        ) : (
          !!existingInfos && <Alert type="info">{translate('text_62d7f6178ec94cd09370e3d1')}</Alert>
        )}
      </Content>
    </Dialog>
  )
})

const PlanItem = styled.span`
  display: flex;
  white-space: pre;
`

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddPlanToCustomerDialog.displayName = 'AddPlanToCustomerDialog'
