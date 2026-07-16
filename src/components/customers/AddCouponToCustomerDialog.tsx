import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { CouponCaption } from '~/components/coupons/CouponCaption'
import { Alert } from '~/components/designSystem/Alert'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { ComboBox, ComboboxItem } from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_COUPON_INPUT_FOR_CUSTOMER_CLASSNAME,
} from '~/core/constants/form'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CouponBillableMetricsForCustomerFragment,
  CouponBillableMetricsForCustomerFragmentDoc,
  CouponCaptionFragmentDoc,
  CouponFrequency,
  CouponItemFragment,
  CouponPlansForCustomerFragment,
  CouponPlansForCustomerFragmentDoc,
  CouponStatusEnum,
  CouponTypeEnum,
  CurrencyEnum,
  Customer,
  LagoApiError,
  useAddCouponMutation,
  useGetCouponForCustomerLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

gql`
  fragment CouponPlansForCustomer on Plan {
    id
    name
  }

  fragment CouponBillableMetricsForCustomer on BillableMetric {
    id
    name
  }

  query getCouponForCustomer(
    $page: Int
    $limit: Int
    $status: CouponStatusEnum
    $searchTerm: String
  ) {
    coupons(page: $page, limit: $limit, status: $status, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        amountCurrency
        amountCents
        couponType
        percentageRate
        frequency
        frequencyDuration
        plans {
          ...CouponPlansForCustomer
        }
        billableMetrics {
          ...CouponBillableMetricsForCustomer
        }
        ...CouponCaption
      }
    }
  }

  mutation addCoupon($input: CreateAppliedCouponInput!) {
    createAppliedCoupon(input: $input) {
      id
    }
  }

  ${CouponBillableMetricsForCustomerFragmentDoc}
  ${CouponPlansForCustomerFragmentDoc}
  ${CouponCaptionFragmentDoc}
`

export const ADD_COUPON_TO_CUSTOMER_FORM_ID = 'add-coupon-to-customer-form'

const defaultFormValues = {
  couponId: '',
  couponType: CouponTypeEnum.FixedAmount as CouponTypeEnum,
  amountCents: undefined as number | undefined,
  amountCurrency: undefined as CurrencyEnum | undefined,
  percentageRate: undefined as number | undefined,
  frequency: undefined as CouponFrequency | undefined,
  frequencyDuration: undefined as number | undefined,
  plans: undefined as CouponPlansForCustomerFragment[] | undefined,
  billableMetrics: undefined as CouponBillableMetricsForCustomerFragment[] | undefined,
}

const validationSchema = z
  .object({
    couponId: z.string().min(1),
    couponType: z.enum([CouponTypeEnum.FixedAmount, CouponTypeEnum.Percentage]),
    amountCents: z.number().optional(),
    amountCurrency: z.string().optional(),
    percentageRate: z.number().optional(),
    frequency: z.enum([CouponFrequency.Once, CouponFrequency.Recurring, CouponFrequency.Forever]),
    frequencyDuration: z.number().optional(),
    plans: z.any().optional(),
    billableMetrics: z.any().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.couponType === CouponTypeEnum.FixedAmount) {
      if (
        value.amountCents === undefined ||
        value.amountCents === null ||
        value.amountCents < 0.001
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_632d68358f1fedc68eed3e91',
          path: ['amountCents'],
        })
      }
      if (!value.amountCurrency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '',
          path: ['amountCurrency'],
        })
      }
    }
    if (value.couponType === CouponTypeEnum.Percentage) {
      if (
        value.percentageRate === undefined ||
        value.percentageRate === null ||
        value.percentageRate < 0.001
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_633445d00315a713775f02a6',
          path: ['percentageRate'],
        })
      }
    }
    if (value.frequency === CouponFrequency.Recurring) {
      if (
        value.frequencyDuration === undefined ||
        value.frequencyDuration === null ||
        value.frequencyDuration < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_63314cfeb607e57577d894c9',
          path: ['frequencyDuration'],
        })
      }
    }
  })

type OpenAddCouponToCustomerDialogData = {
  customer?: Pick<Customer, 'id' | 'displayName'> | null
}

const AddCouponToCustomerDialogContent = withForm({
  defaultValues: defaultFormValues,
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: validationSchema as unknown as never,
  },
  render: function Render({ form }) {
    const { translate } = useInternationalization()
    const [getCoupons, { loading, data }] = useGetCouponForCustomerLazyQuery({
      variables: { limit: 50, status: CouponStatusEnum.Active },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    })

    const couponId = useStore(form.store, (state) => state.values.couponId)
    const couponType = useStore(form.store, (state) => state.values.couponType)
    const frequency = useStore(form.store, (state) => state.values.frequency)
    const plans = useStore(form.store, (state) => state.values.plans)
    const billableMetrics = useStore(form.store, (state) => state.values.billableMetrics)
    const amountCurrency = useStore(form.store, (state) => state.values.amountCurrency)
    const fieldMeta = useStore(form.store, (state) => state.fieldMeta)

    const coupons =
      data?.coupons?.collection?.map((coupon) => {
        const { id, name } = coupon

        return {
          label: name,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {name}
              </Typography>
              <CouponCaption coupon={coupon as CouponItemFragment} variant="caption" />
            </ComboboxItem>
          ),
          value: id,
        }
      }) || []

    const couponIdErrors = fieldMeta?.couponId?.errors as Array<{ message?: string }> | undefined
    const couponIdError = couponIdErrors?.[0]?.message
    const hasCurrencyError = !!(fieldMeta?.amountCurrency?.errors as unknown[] | undefined)?.length

    return (
      <div className="flex flex-col gap-6 p-8">
        <ComboBox
          className={SEARCH_COUPON_INPUT_FOR_CUSTOMER_CLASSNAME}
          name="selectCoupon"
          value={couponId ? String(couponId) : ''}
          label={translate('text_628b8c693e464200e00e4677')}
          data={coupons}
          loading={loading}
          searchQuery={getCoupons}
          placeholder={translate('text_628b8c693e464200e00e4685')}
          onChange={(value) => {
            const coupon = data?.coupons?.collection.find((c) => c.id === value)

            if (coupon) {
              form.setFieldValue('couponId', coupon.id)
              form.setFieldValue(
                'amountCents',
                deserializeAmount(
                  coupon.amountCents || 0,
                  coupon.amountCurrency || CurrencyEnum.Usd,
                ),
              )
              form.setFieldValue('amountCurrency', coupon.amountCurrency ?? undefined)
              form.setFieldValue('percentageRate', coupon.percentageRate ?? undefined)
              form.setFieldValue('couponType', coupon.couponType)
              form.setFieldValue('frequency', coupon.frequency)
              form.setFieldValue('frequencyDuration', coupon.frequencyDuration ?? undefined)
              form.setFieldValue('plans', coupon.plans ?? undefined)
              form.setFieldValue('billableMetrics', coupon.billableMetrics ?? undefined)
            } else {
              form.setFieldValue('couponId', '')
            }
          }}
          PopperProps={{ displayInDialog: true }}
        />

        {!!plans?.length && (
          <div data-test="plan-limitation-section">
            <Typography className="mb-1" variant="captionHl" color="grey700">
              {translate('text_63d66aa2471035c8ff598857')}
            </Typography>
            <div className="flex flex-wrap gap-1">
              {plans.map((plan) => (
                <Chip key={`coupon-plan-appied-to-${plan.id}`} label={plan.name} />
              ))}
            </div>
          </div>
        )}

        {!!billableMetrics?.length && (
          <div data-test="billable-metric-limitation-section">
            <Typography className="mb-1" variant="captionHl" color="grey700">
              {translate('text_63d66aa2471035c8ff598857')}
            </Typography>
            <div className="flex flex-wrap gap-1">
              {billableMetrics.map((bm) => (
                <Chip key={`coupon-billable-metric-appied-to-${bm.id}`} label={bm.name} />
              ))}
            </div>
          </div>
        )}

        {!!couponId && (
          <>
            {couponType === CouponTypeEnum.FixedAmount ? (
              <div className="flex gap-3">
                <form.AppField name="amountCents">
                  {(field) => (
                    <field.AmountInputField
                      className="flex-1"
                      currency={amountCurrency || CurrencyEnum.Usd}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_628b8c693e464200e00e469b')}
                    />
                  )}
                </form.AppField>
                <form.AppField name="amountCurrency">
                  {(field) => (
                    <field.ComboBoxField
                      containerClassName="max-w-30 mt-7"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      disableClearable
                      PopperProps={{ displayInDialog: true }}
                    />
                  )}
                </form.AppField>
              </div>
            ) : (
              <form.AppField name="percentageRate">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter={['positiveNumber', 'quadDecimal']}
                    label={translate('text_632d68358f1fedc68eed3e76')}
                    placeholder={translate('text_632d68358f1fedc68eed3e86')}
                    InputProps={{
                      endAdornment: (
                        <Typography className="mr-4 shrink-0" variant="body" color="textSecondary">
                          {translate('text_632d68358f1fedc68eed3e93')}
                        </Typography>
                      ),
                    }}
                  />
                )}
              </form.AppField>
            )}

            <form.AppField name="frequency">
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_632d68358f1fedc68eed3e9d')}
                  helperText={translate('text_632d68358f1fedc68eed3eab')}
                  data={[
                    {
                      value: CouponFrequency.Once,
                      label: translate('text_632d68358f1fedc68eed3ea3'),
                    },
                    {
                      value: CouponFrequency.Recurring,
                      label: translate('text_632d68358f1fedc68eed3e64'),
                    },
                    {
                      value: CouponFrequency.Forever,
                      label: translate('text_63c83a3476e46bc6ab9d85d6'),
                    },
                  ]}
                  disableClearable
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>

            {frequency === CouponFrequency.Recurring && (
              <form.AppField name="frequencyDuration">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter={['positiveNumber', 'int']}
                    label={translate('text_632d68358f1fedc68eed3e80')}
                    placeholder={translate('text_632d68358f1fedc68eed3e88')}
                    InputProps={{
                      endAdornment: (
                        <Typography className="mr-4 shrink-0" variant="body" color="textSecondary">
                          {translate('text_632d68358f1fedc68eed3e95')}
                        </Typography>
                      ),
                    }}
                  />
                )}
              </form.AppField>
            )}
          </>
        )}
        {!!couponIdError && couponIdError !== '' && <Alert type="danger">{couponIdError}</Alert>}
        {!!amountCurrency && hasCurrencyError && (
          <Alert type="danger">{translate('text_632c88c97af78294bc02ea9d')}</Alert>
        )}
        {!!couponId && couponIdError === '' && (
          <Alert type="danger">{translate('text_64352657267c3d916f96278a')}</Alert>
        )}
      </div>
    )
  },
})

export const useAddCouponToCustomerDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddCouponToCustomerDialogData | null>(null)
  const successRef = useRef(false)
  const shouldRefetchOnCloseRef = useRef(false)

  const [addCoupon] = useAddCouponMutation({
    context: {
      silentErrorCodes: [
        LagoApiError.CouponIsNotReusable,
        LagoApiError.UnprocessableEntity,
        LagoApiError.PlanOverlapping,
      ],
    },
    onCompleted({ createAppliedCoupon }) {
      if (createAppliedCoupon) {
        successRef.current = true
        shouldRefetchOnCloseRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_628b8c693e464200e00e49f2',
        })
      }
    },
  })

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      // Zod's `.optional()` output shape doesn't line up with the FormValues
      // literal (property-optional vs. property-may-be-undefined). Cast to any
      // to bypass the mismatch; the runtime validation is still correct.
      onDynamic: validationSchema as unknown as never,
    },
    onSubmit: async ({ value, formApi }) => {
      const customer = dataRef.current?.customer

      if (!customer?.id) return

      const {
        couponId,
        couponType,
        amountCents,
        amountCurrency,
        percentageRate,
        frequency,
        frequencyDuration,
      } = value

      const answer = await addCoupon({
        variables: {
          input: {
            customerId: customer.id,
            couponId,
            frequency: frequency as CouponFrequency,
            amountCents:
              couponType === CouponTypeEnum.FixedAmount
                ? serializeAmount(amountCents || 0, amountCurrency || CurrencyEnum.Usd)
                : undefined,
            amountCurrency: couponType === CouponTypeEnum.FixedAmount ? amountCurrency : undefined,
            percentageRate:
              couponType === CouponTypeEnum.Percentage ? Number(percentageRate) : undefined,
            frequencyDuration:
              frequency === CouponFrequency.Recurring ? frequencyDuration : undefined,
          },
        },
      })

      const { errors } = answer

      if (hasDefinedGQLError('CouponIsNotReusable', errors)) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              couponId: {
                message: translate('text_638f48274d41e3f1d01fc119', {
                  customerFullName: customer.displayName,
                }),
                path: ['couponId'],
              },
            },
          },
        })
      } else if (hasDefinedGQLError('CurrenciesDoesNotMatch', errors, 'currency')) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              amountCurrency: { message: '', path: ['amountCurrency'] },
            },
          },
        })
      } else if (hasDefinedGQLError('PlanOverlapping', errors)) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              couponId: { message: '', path: ['couponId'] },
            },
          },
        })
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openAddCouponToCustomerDialog = (openData?: OpenAddCouponToCustomerDialogData) => {
    dataRef.current = openData ?? null
    form.reset()
    shouldRefetchOnCloseRef.current = false

    formDialog
      .open({
        title: translate('text_628b8c693e464200e00e465b'),
        description: translate('text_628b8c693e464200e00e4669'),
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${SEARCH_COUPON_INPUT_FOR_CUSTOMER_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: <AddCouponToCustomerDialogContent form={form} />,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="submit">
              {translate('text_628b8c693e464200e00e46a1')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_COUPON_TO_CUSTOMER_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close' || response.reason === 'success') {
          form.reset()
          dataRef.current = null

          if (shouldRefetchOnCloseRef.current) {
            shouldRefetchOnCloseRef.current = false
            client.refetchQueries({
              include: ['getAppliedCouponsForCustomer', 'getAppliedCouponsForCouponDetails'],
            })
          }
        }
      })
  }

  return { openAddCouponToCustomerDialog }
}
