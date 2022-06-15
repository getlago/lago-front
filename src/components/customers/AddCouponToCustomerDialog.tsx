import { forwardRef, useMemo, useRef, useEffect, RefObject } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string, number } from 'yup'
import { useFormik } from 'formik'

import { Dialog, Button, DialogRef, Typography, Alert } from '~/components/designSystem'
import { ComboBoxField, TextInputField, ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/useInternationalization'
import {
  useGetCouponForCustomerLazyQuery,
  CreateAppliedCouponInput,
  CurrencyEnum,
  useAddCouponMutation,
  Lago_Api_Error,
  CouponStatusEnum,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { addToast, LagoGQLError } from '~/core/apolloClient'

gql`
  query getCouponForCustomer($page: Int, $limit: Int, $status: CouponStatusEnum) {
    coupons(page: $page, limit: $limit, status: $status) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        amountCurrency
        amountCents
      }
    }
  }

  mutation addCoupon($input: CreateAppliedCouponInput!) {
    createAppliedCoupon(input: $input) {
      id
    }
  }
`

export interface AddCouponToCustomerDialogRef extends DialogRef {}

interface AddCouponToCustomerDialogProps {
  customerId: string
}

export const AddCouponToCustomerDialog = forwardRef<
  AddCouponToCustomerDialogRef,
  AddCouponToCustomerDialogProps
>(({ customerId }: AddCouponToCustomerDialogProps, ref) => {
  const { translate } = useInternationalization()
  const mounted = useRef(false)
  const [getCoupons, { loading, data }] = useGetCouponForCustomerLazyQuery({
    variables: { limit: 50, status: CouponStatusEnum.Active },
  })
  const [addCoupon] = useAddCouponMutation({
    context: {
      silentErrorCodes: [
        Lago_Api_Error.CouponAlreadyApplied,
        Lago_Api_Error.CurrenciesDoesNotMatch,
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
  const formikProps = useFormik<Omit<CreateAppliedCouponInput, 'customerId'>>({
    initialValues: {
      // @ts-ignore
      couponId: undefined,
      amountCents: undefined,
      amountCurrency: CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      amountCents: number().required(''),
      amountCurrency: string().required(''),
      couponId: string().required(''),
    }),
    validateOnMount: true,
    onSubmit: async ({ amountCents, ...values }, formikBag) => {
      const answer = await addCoupon({
        variables: {
          input: {
            amountCents: (amountCents || 0) * 100,
            customerId,
            ...values,
          },
        },
        refetchQueries: ['getCustomer'],
      })

      const { errors } = answer
      const error = !errors ? undefined : (errors[0]?.extensions as LagoGQLError['extensions'])

      if (!!error && error?.code === Lago_Api_Error.CouponAlreadyApplied) {
        formikBag.setFieldError('couponId', translate('text_628b8c693e464200e00e46c5'))
      } else if (!!error && error?.code === Lago_Api_Error.CurrenciesDoesNotMatch) {
        formikBag.setFieldError('amountCurrency', translate('text_628b8c693e464200e00e46c3'))
      } else {
        ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
        if (mounted.current) {
          formikBag.resetForm()
        }
      }
    },
  })

  const coupons = useMemo(() => {
    if (!data || !data?.coupons || !data?.coupons?.collection) return []

    return data?.coupons?.collection.map(({ id, name, amountCents, amountCurrency }) => {
      return {
        label: name,
        labelNode: (
          <Item>
            {name} -{' '}
            <Typography color="textPrimary">
              (
              {translate('text_628c83763b29a500a8785d0c', {
                amount: intlFormatNumber(amountCents || 0, {
                  currencyDisplay: 'code',
                  currency: amountCurrency,
                }),
              })}
              )
            </Typography>
          </Item>
        ),
        value: id,
      }
    })
  }, [data, translate])

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const error = formikProps.errors?.couponId || formikProps.errors?.amountCurrency

  return (
    <Dialog
      ref={ref}
      title={translate('text_628b8c693e464200e00e465b')}
      description={translate('text_628b8c693e464200e00e4669')}
      onOpen={() => {
        // TODO get coupons
        if (!loading && !data) {
          getCoupons()
        }
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              if (mounted.current) {
                formikProps.resetForm()
              }
            }}
          >
            {translate('text_628b8c693e464200e00e4693')}
          </Button>
          <Button
            disabled={!formikProps.isValid}
            onClick={async () => await formikProps.handleSubmit()}
          >
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
          placeholder={translate('text_628b8c693e464200e00e4685')}
          onChange={(value) => {
            const coupon = data?.coupons?.collection.find((c) => c.id === value)

            if (!!coupon) {
              formikProps.setValues({
                couponId: coupon.id,
                amountCents: coupon.amountCents / 100,
                amountCurrency: coupon.amountCurrency,
              })
            }
          }}
          PopperProps={{ displayInDialog: true }}
        />

        {!!formikProps.values.couponId && (
          <LineAmount>
            <TextInputField
              name="amountCents"
              beforeChangeFormatter={['positiveNumber', 'decimal']}
              label={translate('text_628b8c693e464200e00e469b')}
              placeholder={translate('text_62876e85e32e0300e1803143')}
              formikProps={formikProps}
            />
            <ComboBoxField
              name="amountCurrency"
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              disableClearable
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
            />
          </LineAmount>
        )}
        {!!error && <Alert type="danger">{error}</Alert>}
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

AddCouponToCustomerDialog.displayName = 'AddCouponToCustomerDialog'
