import { useMemo, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { FormikProps } from 'formik'
import { DateTime } from 'luxon'
import { gql } from '@apollo/client'

import { Card } from '~/styles'
import { ComboBoxField, TextInputField, DatePicker, ButtonSelectorField } from '~/components/form'
import { Alert, Typography } from '~/components/designSystem'
import {
  useGetPlansLazyQuery,
  CreateSubscriptionWithOverrideInput,
  PlanInterval,
  BillingTimeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

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
`

interface SubscriptionInfoFormProps {
  existingPlanId?: string
  existingPlanEndDate?: string
  formikProps: FormikProps<
    Omit<CreateSubscriptionWithOverrideInput & { planId: string }, 'customerId'>
  >
}

export const SubscriptionInfoForm = ({
  existingPlanId,
  existingPlanEndDate,
  formikProps,
}: SubscriptionInfoFormProps) => {
  const { translate } = useInternationalization()
  const currentDateRef = useRef<DateTime>(DateTime.now())
  const [getPlans, { loading, data }] = useGetPlansLazyQuery()
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
        disabled: !!existingPlanId && existingPlanId === id,
      }
    })
  }, [data, existingPlanId])

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

  useEffect(() => {
    !data?.plans && getPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card>
      <Typography variant="subhead">{translate('text_63185bc45c245fd640b32a01')}</Typography>
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
          {!existingPlanId && (
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
        !!existingPlanId &&
        !!existingPlanEndDate && (
          <Alert type="info">
            {translate('text_631894c5378934166c854042', {
              date: DateTime.fromISO(existingPlanEndDate).toFormat('LLL. dd, yyyy'),
            })}
          </Alert>
        )
      )}
    </Card>
  )
}

const PlanItem = styled.span`
  display: flex;
  white-space: pre;
`
