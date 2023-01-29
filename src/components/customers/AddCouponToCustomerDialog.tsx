import { forwardRef, useMemo, RefObject, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string, number } from 'yup'
import { useFormik } from 'formik'

import { Dialog, Button, DialogRef, Alert, Typography, Chip } from '~/components/designSystem'
import { ComboBoxField, TextInputField, ComboBox, AmountInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  useGetCouponForCustomerLazyQuery,
  CreateAppliedCouponInput,
  CurrencyEnum,
  useAddCouponMutation,
  LagoApiError,
  CouponStatusEnum,
  CouponCaptionFragmentDoc,
  CouponItemFragment,
  CouponTypeEnum,
  CouponFrequency,
  CouponPlansForCustomerFragment,
  CouponPlansForCustomerFragmentDoc,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CouponCaption } from '~/components/coupons/CouponCaption'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'

gql`
  fragment CouponPlansForCustomer on Plan {
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
        ...CouponCaption
      }
    }
  }

  mutation addCoupon($input: CreateAppliedCouponInput!) {
    createAppliedCoupon(input: $input) {
      id
    }
  }

  ${CouponPlansForCustomerFragmentDoc}
  ${CouponCaptionFragmentDoc}
`

type FormType = CreateAppliedCouponInput & {
  couponType: CouponTypeEnum
  plans?: CouponPlansForCustomerFragment[] | null
}

export interface AddCouponToCustomerDialogRef extends DialogRef {}

interface AddCouponToCustomerDialogProps {
  customerId: string
  customerName: string
}

export const AddCouponToCustomerDialog = forwardRef<
  AddCouponToCustomerDialogRef,
  AddCouponToCustomerDialogProps
>(({ customerId, customerName }: AddCouponToCustomerDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [currencyError, setCurrencyError] = useState(false)
  const [planOverlappingError, setPlanOverlappingError] = useState(false)
  const [getCoupons, { loading, data }] = useGetCouponForCustomerLazyQuery({
    variables: { limit: 50, status: CouponStatusEnum.Active },
  })
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
        addToast({
          severity: 'success',
          translateKey: 'text_628b8c693e464200e00e49f2',
        })
      }
    },
  })
  const resetAllManualErrors = () => {
    setCurrencyError(false)
    setPlanOverlappingError(false)
  }
  const formikProps = useFormik<Omit<FormType, 'customerId'>>({
    initialValues: {
      // @ts-ignore
      couponId: undefined,
      amountCents: undefined,
      percentageRate: undefined,
      couponType: CouponTypeEnum.FixedAmount,
      frequency: undefined,
      frequencyDuration: undefined,
      amountCurrency: undefined,
      plans: undefined,
    },
    validationSchema: object().shape({
      couponId: string().required(''),
      amountCents: number().when('couponType', {
        is: (couponType: CouponTypeEnum) =>
          !!couponType && couponType === CouponTypeEnum.FixedAmount,
        then: number()
          .typeError(translate('text_624ea7c29103fd010732ab7d'))
          .min(0.001, 'text_632d68358f1fedc68eed3e91')
          .required(''),
      }),
      amountCurrency: string()
        .when('couponType', {
          is: (couponType: CouponTypeEnum) =>
            !!couponType && couponType === CouponTypeEnum.FixedAmount,
          then: string().required(''),
        })
        .nullable(),
      percentageRate: number()
        .when('couponType', {
          is: (couponType: CouponTypeEnum) =>
            !!couponType && couponType === CouponTypeEnum.Percentage,
          then: number()
            .typeError(translate('text_624ea7c29103fd010732ab7d'))
            .min(0.001, 'text_633445d00315a713775f02a6')
            .required(''),
        })
        .nullable(),
      couponType: string().required('').nullable(),
      frequency: string().required('').nullable(),
      frequencyDuration: number()
        .when('frequency', {
          is: (frequency: CouponFrequency) =>
            !!frequency && frequency === CouponFrequency.Recurring,
          then: number()
            .typeError(translate('text_63314cfeb607e57577d894c9'))
            .min(1, 'text_63314cfeb607e57577d894c9')
            .required(''),
        })
        .nullable(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (
      { amountCents, amountCurrency, percentageRate, frequencyDuration, ...values },
      formikBag
    ) => {
      const couponValues = { ...values, couponType: undefined, plans: undefined }

      resetAllManualErrors()

      const answer = await addCoupon({
        variables: {
          input: {
            customerId,
            amountCents:
              values.couponType === CouponTypeEnum.FixedAmount
                ? serializeAmount(amountCents || 0, amountCurrency || CurrencyEnum.Usd)
                : undefined,
            amountCurrency:
              values.couponType === CouponTypeEnum.FixedAmount ? amountCurrency : undefined,
            percentageRate:
              values.couponType === CouponTypeEnum.Percentage ? Number(percentageRate) : undefined,
            frequencyDuration:
              values.frequency === CouponFrequency.Recurring ? frequencyDuration : undefined,
            ...couponValues,
          },
        },
        refetchQueries: ['getCustomer'],
      })

      const { errors } = answer

      if (hasDefinedGQLError('CouponIsNotReusable', errors)) {
        formikBag.setFieldError(
          'couponId',
          translate('text_638f48274d41e3f1d01fc119', { customerFullName: customerName })
        )
      } else if (hasDefinedGQLError('CurrenciesDoesNotMatch', errors, 'currency')) {
        setCurrencyError(true)
      } else if (hasDefinedGQLError('PlanOverlapping', errors)) {
        setPlanOverlappingError(true)
      } else {
        ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
        formikBag.resetForm()
        resetAllManualErrors()
      }
    },
  })

  const coupons = useMemo(() => {
    if (!data || !data?.coupons || !data?.coupons?.collection) return []

    return data?.coupons?.collection.map((coupon) => {
      const { id, name } = coupon

      return {
        label: name,
        labelNode: (
          <Item>
            {name} - <CouponCaption coupon={coupon as CouponItemFragment} variant="body" />
          </Item>
        ),
        value: id,
      }
    })
  }, [data])

  return (
    <Dialog
      ref={ref}
      title={translate('text_628b8c693e464200e00e465b')}
      description={translate('text_628b8c693e464200e00e4669')}
      onOpen={() => {
        if (!loading && !data) {
          getCoupons()
        }
      }}
      onClickAway={() => {
        formikProps.resetForm()
        resetAllManualErrors()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
              resetAllManualErrors()
            }}
          >
            {translate('text_628b8c693e464200e00e4693')}
          </Button>
          <Button disabled={!formikProps.isValid} onClick={formikProps.submitForm}>
            {translate('text_628b8c693e464200e00e46a1')}
          </Button>
        </>
      )}
    >
      <Container>
        <ComboBox
          value={formikProps.values.couponId}
          label={translate('text_628b8c693e464200e00e4677')}
          data={coupons}
          loading={loading}
          searchQuery={getCoupons}
          placeholder={translate('text_628b8c693e464200e00e4685')}
          onChange={(value) => {
            const coupon = data?.coupons?.collection.find((c) => c.id === value)

            if (!!coupon) {
              formikProps.setValues({
                couponId: coupon.id,
                amountCents: deserializeAmount(
                  coupon.amountCents || 0,
                  coupon.amountCurrency || CurrencyEnum.Usd
                ),
                amountCurrency: coupon.amountCurrency,
                percentageRate: coupon.percentageRate,
                couponType: coupon.couponType,
                frequency: coupon.frequency,
                frequencyDuration: coupon.frequencyDuration,
                plans: coupon.plans,
              })
            } else {
              formikProps.setFieldValue('couponId', undefined)
            }
          }}
          PopperProps={{ displayInDialog: true }}
        />

        {!!formikProps.values.plans?.length && (
          <div>
            <PlanListLabel variant="captionHl" color="grey700">
              {translate('text_63d66aa2471035c8ff598857')}
            </PlanListLabel>
            <PlanChipWrapper>
              {formikProps.values.plans.map((plan) => (
                <Chip key={`coupon-plan-appied-to-${plan.id}`} label={plan.name} />
              ))}
            </PlanChipWrapper>
          </div>
        )}

        {!!formikProps.values.couponId && (
          <>
            {formikProps.values.couponType === CouponTypeEnum.FixedAmount ? (
              <LineAmount>
                <AmountInputField
                  name="amountCents"
                  currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                  beforeChangeFormatter={['positiveNumber']}
                  label={translate('text_628b8c693e464200e00e469b')}
                  formikProps={formikProps}
                />
                <ComboBoxField
                  name="amountCurrency"
                  data={Object.values(CurrencyEnum).map((currencyType) => ({
                    value: currencyType,
                  }))}
                  isEmptyNull={false}
                  disableClearable
                  formikProps={formikProps}
                  PopperProps={{ displayInDialog: true }}
                />
              </LineAmount>
            ) : (
              <TextInputField
                name="percentageRate"
                beforeChangeFormatter={['positiveNumber', 'decimal']}
                label={translate('text_632d68358f1fedc68eed3e76')}
                placeholder={translate('text_632d68358f1fedc68eed3e86')}
                formikProps={formikProps}
                InputProps={{
                  endAdornment: (
                    <InputEnd variant="body" color="textSecondary">
                      {translate('text_632d68358f1fedc68eed3e93')}
                    </InputEnd>
                  ),
                }}
              />
            )}

            <ComboBoxField
              name="frequency"
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
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
            />

            {formikProps.values.frequency === CouponFrequency.Recurring && (
              <TextInputField
                name="frequencyDuration"
                beforeChangeFormatter={['positiveNumber', 'int']}
                label={translate('text_632d68358f1fedc68eed3e80')}
                placeholder={translate('text_632d68358f1fedc68eed3e88')}
                formikProps={formikProps}
                InputProps={{
                  endAdornment: (
                    <InputEnd variant="body" color="textSecondary">
                      {translate('text_632d68358f1fedc68eed3e95')}
                    </InputEnd>
                  ),
                }}
              />
            )}
          </>
        )}
        {!!formikProps.errors?.couponId && (
          <Alert type="danger">{formikProps.errors?.couponId}</Alert>
        )}
        {!!currencyError && (
          <Alert type="danger">{translate('text_632c88c97af78294bc02ea9d')}</Alert>
        )}
        {!!planOverlappingError && (
          <Alert type="danger">{translate('text_63d6743e174d22e410d7bd66')}</Alert>
        )}
      </Container>
    </Dialog>
  )
})

const Container = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const Item = styled.span`
  display: flex;
  white-space: pre;
`

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`

const InputEnd = styled(Typography)`
  flex-shrink: 0;
  margin-right: ${theme.spacing(4)};
`

const PlanListLabel = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const PlanChipWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

AddCouponToCustomerDialog.displayName = 'AddCouponToCustomerDialog'
