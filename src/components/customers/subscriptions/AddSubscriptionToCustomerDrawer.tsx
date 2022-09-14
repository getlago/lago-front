import { forwardRef, RefObject, useState, useImperativeHandle, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { gql } from '@apollo/client'

import {
  Drawer,
  DrawerRef,
  Button,
  Typography,
  Skeleton,
  Icon,
  Tooltip,
  IconSizeEnum,
} from '~/components/designSystem'
import { Switch, SwitchField } from '~/components/form'
import { PlanModelBlockForm } from '~/components/plans/PlanModelBlockForm'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast, LagoGQLError } from '~/core/apolloClient'
import { theme, Card } from '~/styles'
import { ChargeAccordion } from '~/components/plans/ChargeAccordion'
import { serializePlanCreateInput } from '~/serializers/serializePlanInput'
import { PlanFormInput } from '~/components/plans/types'
import {
  CustomerSubscriptionListFragmentDoc,
  useCreateSubscriptionMutation,
  CreateSubscriptionWithOverrideInput,
  Lago_Api_Error,
  BillingTimeEnum,
  VolumeRangesFragmentDoc,
  useGetPlanOverrideLazyQuery,
  CurrencyEnum,
  PlanInterval,
  useCreateSubscriptionWithOverrideMutation,
} from '~/generated/graphql'
import { chargesValidationSchema } from '~/formValidationSchemas'

import { SubscriptionInfoForm } from './SubscriptionInfoForm'

gql`
  fragment OverridePlan on PlanDetails {
    id
    code
    name
    interval
    amountCents
    amountCurrency
    payInAdvance
    trialPeriod
    canBeDeleted
    billChargesMonthly
    charges {
      id
      billableMetric {
        id
        name
        code
      }
      graduatedRanges {
        flatAmount
        fromValue
        perUnitAmount
        toValue
      }
      ...VolumeRanges
      amount
      chargeModel
      freeUnits
      packageSize
      rate
      fixedAmount
      freeUnitsPerEvents
      freeUnitsPerTotalAggregation
    }
  }

  query getPlanOverride($id: ID!) {
    plan(id: $id) {
      ...EditPlan
    }
  }

  mutation createSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      ...CustomerSubscriptionList
    }
  }

  mutation createSubscriptionWithOverride($input: CreateSubscriptionWithOverrideInput!) {
    createSubscriptionWithOverride(input: $input) {
      ...CustomerSubscriptionList
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

export interface AddSubscriptionToCustomerDrawerRef {
  openDrawer: (drawerInfos?: {
    subscriptionId?: string
    existingPlanId?: string
    hasNoSubscription?: boolean
    endDate?: string
  }) => unknown
  closeDrawer: () => unknown
}

interface AddSubscriptionToCustomerDrawerProps {
  customerName: string
  customerId: string
}

export const AddSubscriptionToCustomerDrawer = forwardRef<
  AddSubscriptionToCustomerDrawerRef,
  AddSubscriptionToCustomerDrawerProps
>(({ customerId, customerName }: AddSubscriptionToCustomerDrawerProps, ref) => {
  const drawerRef = useRef<DrawerRef>(null)
  const [subscriptionInfos, setSubscriptionInfos] = useState<
    | {
        subscriptionId?: string
        existingPlanId?: string
        hasNoSubscription?: boolean
        endDate?: string
      }
    | undefined
  >(undefined)
  const [getPlanToOverride, { loading }] = useGetPlanOverrideLazyQuery()
  const { translate } = useInternationalization()
  const [create] = useCreateSubscriptionMutation({
    context: {
      silentErrorCodes: [Lago_Api_Error.CurrenciesDoesNotMatch],
    },
    onCompleted: async ({ createSubscription }) => {
      if (!!createSubscription) {
        addToast({
          message: subscriptionInfos?.subscriptionId
            ? translate('text_62d7f6178ec94cd09370e69a')
            : translate('text_62544f170d205200f09d5938'),
          severity: 'success',
        })
      }
    },
  })
  const [createWithOverride] = useCreateSubscriptionWithOverrideMutation({
    context: {
      silentErrorCodes: [Lago_Api_Error.CurrenciesDoesNotMatch],
    },
    onCompleted: async ({ createSubscriptionWithOverride }) => {
      if (!!createSubscriptionWithOverride) {
        addToast({
          message: subscriptionInfos?.subscriptionId
            ? translate('text_62d7f6178ec94cd09370e69a')
            : translate('text_62544f170d205200f09d5938'),
          severity: 'success',
        })
      }
    },
  })
  const formikProps = useFormik<
    Omit<CreateSubscriptionWithOverrideInput & { planId: string }, 'customerId'>
  >({
    initialValues: {
      // @ts-ignore
      planId: undefined,
      name: '',
      billingTime: BillingTimeEnum.Calendar,
      // @ts-ignore
      overriddenPlanId: undefined,
      // @ts-ignore
      plan: undefined,
    },
    validationSchema: object().shape({
      planId: string().required(''),
      plan: object().when('overriddenPlanId', {
        is: (overriddenPlanId: string) => !!overriddenPlanId,
        then: object().shape({
          amountCents: string().required(''),
          charges: chargesValidationSchema,
        }),
      }),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ plan, planId, ...values }, formikBag) => {
      const answer = !!values?.overriddenPlanId
        ? await createWithOverride({
            variables: {
              input: {
                customerId,
                ...(subscriptionInfos?.subscriptionId
                  ? { subscriptionId: subscriptionInfos.subscriptionId }
                  : {}),
                ...values,
                plan: serializePlanCreateInput(plan as unknown as PlanFormInput),
              },
            },
            refetchQueries: ['getCustomer'],
          })
        : await create({
            variables: {
              input: {
                customerId,
                planId,
                ...(subscriptionInfos?.subscriptionId
                  ? { subscriptionId: subscriptionInfos.subscriptionId }
                  : {}),
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
        ;(ref as unknown as RefObject<DrawerRef>)?.current?.closeDrawer()
        formikBag.resetForm()
      }
    },
  })

  const updatePlanOverride: (planId?: string) => Promise<void> = async (planId) => {
    if (!planId) {
      formikProps.setFieldValue('plan', undefined)
      formikProps.setFieldValue('overriddenPlanId', undefined)
    } else {
      formikProps.setFieldValue('overriddenPlanId', planId)

      const { data: planData } = await getPlanToOverride({ variables: { id: planId } })

      formikProps.setFieldValue('plan', {
        ...planData?.plan,
        charges: planData?.plan?.charges?.map(
          ({
            amount,
            fixedAmount,
            freeUnitsPerEvents,
            freeUnitsPerTotalAggregation,
            graduatedRanges,
            volumeRanges,
            packageSize,
            rate,
            freeUnits,
            ...charge
          }) => ({
            // Amount can be null and this breaks the validation
            amount: amount || undefined,
            freeUnits: freeUnits || undefined,
            packageSize:
              packageSize === null || packageSize === undefined ? undefined : packageSize,
            fixedAmount: fixedAmount || undefined,
            freeUnitsPerEvents: freeUnitsPerEvents || undefined,
            freeUnitsPerTotalAggregation: freeUnitsPerTotalAggregation || undefined,
            graduatedRanges: !graduatedRanges ? null : graduatedRanges,
            volumeRanges: !volumeRanges ? null : volumeRanges,
            rate: rate || undefined,
            ...charge,
          })
        ),
      })
    }
  }

  // useEffect(() => {
  //   if (!!formikProps.values.overriddenPlanId) {
  //     getPlanToOverride({ variables: { id: formikProps.values.overriddenPlanId } })
  //   } else {
  //     formikProps.setFieldValue('plan', undefined)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [formikProps.values.overriddenPlanId, getPlanToOverride])

  // useEffect(() => {
  //   if (data?.plan && formikProps.values.overriddenPlanId) {
  //     formikProps.setFieldValue('plan', {
  //       ...data?.plan,
  //       charges: data?.plan.charges?.map(
  //         ({
  //           amount,
  //           fixedAmount,
  //           freeUnitsPerEvents,
  //           freeUnitsPerTotalAggregation,
  //           graduatedRanges,
  //           volumeRanges,
  //           packageSize,
  //           rate,
  //           freeUnits,
  //           ...charge
  //         }) => ({
  //           // Amount can be null and this breaks the validation
  //           amount: amount || undefined,
  //           freeUnits: freeUnits || undefined,
  //           packageSize:
  //             packageSize === null || packageSize === undefined ? undefined : packageSize,
  //           fixedAmount: fixedAmount || undefined,
  //           freeUnitsPerEvents: freeUnitsPerEvents || undefined,
  //           freeUnitsPerTotalAggregation: freeUnitsPerTotalAggregation || undefined,
  //           graduatedRanges: !graduatedRanges ? null : graduatedRanges,
  //           volumeRanges: !volumeRanges ? null : volumeRanges,
  //           rate: rate || undefined,
  //           ...charge,
  //         })
  //       ),
  //     })
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [data, formikProps.values.overriddenPlanId])

  useEffect(() => {
    if (!!formikProps.values.overriddenPlanId) {
      updatePlanOverride(formikProps.values.planId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.planId])

  useImperativeHandle(ref, () => ({
    openDrawer: (infos) => {
      setSubscriptionInfos(infos)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  return (
    <Drawer
      ref={drawerRef}
      title={translate(
        subscriptionInfos?.subscriptionId
          ? 'text_631894c5378934166c854030'
          : 'text_625434c7bb2cb40124c81a19',
        { customerName }
      )}
      onClose={() => formikProps.resetForm()}
    >
      <>
        <Content>
          <Title>
            <Typography variant="headline">
              {translate(
                subscriptionInfos?.subscriptionId
                  ? 'text_631894c5378934166c854032'
                  : 'text_625434c7bb2cb40124c81a19',
                { customerName }
              )}
            </Typography>
            <Typography>
              {translate(
                subscriptionInfos?.subscriptionId
                  ? 'text_631894c5378934166c854034'
                  : 'text_63185bc45c245fd640b329ff'
              )}
            </Typography>
          </Title>

          <SubscriptionInfoForm
            existingPlanId={subscriptionInfos?.existingPlanId}
            formikProps={formikProps}
            existingPlanEndDate={subscriptionInfos?.endDate}
          />

          {!!formikProps?.values?.planId && (
            <Card>
              <Switch
                label={translate('text_63185bc45c245fd640b32a19')}
                subLabel={translate('text_63185bc45c245fd640b32a1b', { customerName })}
                checked={!!formikProps.values.overriddenPlanId}
                onChange={(value) =>
                  updatePlanOverride(value ? formikProps.values.planId : undefined)
                }
              />
            </Card>
          )}

          {loading &&
            [1, 2].map((_, i) => (
              <Card key={`card-plan-form-skeleton-${i}`}>
                <Skeleton variant="text" height={12} width={416} marginBottom={theme.spacing(9)} />
                <Skeleton variant="text" height={12} width={656} marginBottom={theme.spacing(4)} />
                <Skeleton variant="text" height={12} width={256} />
              </Card>
            ))}
          {!!formikProps?.values?.plan && !!formikProps.values.plan.charges?.length && (
            <>
              <PlanModelBlockForm
                hasNoSubscription={subscriptionInfos?.hasNoSubscription}
                title={translate('text_631a0306fa3bc539f0e8a641')}
                values={formikProps?.values?.plan}
                type="override"
                onChange={(field, value) => formikProps.setFieldValue(`plan.${field}`, value)}
              />

              <Card>
                <Typography variant="subhead">
                  {translate('text_631a0306fa3bc539f0e8a65b')}
                </Typography>

                {formikProps.values.plan.charges.map((charge, i) => {
                  return (
                    <ChargeAccordion
                      id={charge.id || `override-charge-${i}`}
                      key={charge.id}
                      currency={formikProps.values.plan.amountCurrency || CurrencyEnum.Usd}
                      index={i}
                      preventDelete
                      formikIdentifier="plan.charges"
                      formikProps={formikProps}
                    />
                  )
                })}

                {formikProps.values.plan.interval === PlanInterval.Yearly && (
                  <ChargeInvoiceLine>
                    <SwitchField
                      labelPosition="left"
                      label={translate('text_62a30bc79dae432fb055330b')}
                      name="plan.billChargesMonthly"
                      formikProps={formikProps}
                    />
                    <ChargeInvoiceTooltip
                      title={translate('text_62a30bc79dae432fb055330f')}
                      placement="top-end"
                    >
                      <Icon name="info-circle" />
                    </ChargeInvoiceTooltip>
                  </ChargeInvoiceLine>
                )}
              </Card>
            </>
          )}
        </Content>
        <SubmitButton>
          <Button
            size="large"
            fullWidth
            disabled={!formikProps.isValid}
            onClick={formikProps.submitForm}
          >
            {subscriptionInfos?.subscriptionId
              ? translate('text_62559eef7b0ccc015127e3a1')
              : translate('text_63185bc45c245fd640b32a1f', { customerName })}
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

const ChargeInvoiceLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }
`

const ChargeInvoiceTooltip = styled(Tooltip)`
  height: ${IconSizeEnum.medium};
`

AddSubscriptionToCustomerDrawer.displayName = 'AddSubscriptionToCustomerDrawer'
