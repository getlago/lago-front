import { forwardRef, useMemo, RefObject, useState } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string, number } from 'yup'
import { useFormik } from 'formik'

import { Dialog, Button, DialogRef, Typography, Alert } from '~/components/designSystem'
import { ComboBoxField, ComboBox, AmountInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  useAddAddOnMutation,
  useGetAddOnsForCustomerLazyQuery,
  CreateAppliedAddOnInput,
  CurrencyEnum,
  LagoApiError,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'

gql`
  query getAddOnsForCustomer($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
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

  mutation addAddOn($input: CreateAppliedAddOnInput!) {
    createAppliedAddOn(input: $input) {
      id
    }
  }
`

export interface AddAddOnToCustomerDialogRef extends DialogRef {}

interface AddAddOnToCustomerDialogProps {
  customerId: string
}

export const AddAddOnToCustomerDialog = forwardRef<
  AddAddOnToCustomerDialogRef,
  AddAddOnToCustomerDialogProps
>(({ customerId }: AddAddOnToCustomerDialogProps, ref) => {
  const [currencyError, setCurrencyError] = useState(false)
  const { translate } = useInternationalization()
  const [getAddOns, { loading, data }] = useGetAddOnsForCustomerLazyQuery({
    variables: { limit: 50 },
  })
  const [addCoupon] = useAddAddOnMutation({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    onCompleted({ createAppliedAddOn }) {
      if (createAppliedAddOn) {
        addToast({
          severity: 'success',
          translateKey: 'text_629781ec7c6c1500d94fbc98',
        })
      }
    },
  })
  const formikProps = useFormik<Omit<CreateAppliedAddOnInput, 'customerId'>>({
    initialValues: {
      // @ts-ignore
      addOnId: undefined,
      amountCents: undefined,
      amountCurrency: CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      amountCents: number().required(''),
      amountCurrency: string().required(''),
      addOnId: string().required(''),
    }),
    validateOnMount: true,
    onSubmit: async ({ amountCents, amountCurrency, ...values }, formikBag) => {
      const answer = await addCoupon({
        variables: {
          input: {
            amountCents: serializeAmount(amountCents || 0, amountCurrency || CurrencyEnum.Usd),
            amountCurrency,
            customerId,
            ...values,
          },
        },
        refetchQueries: ['getCustomer'],
      })

      const { errors } = answer

      if (hasDefinedGQLError('CurrenciesDoesNotMatch', errors)) {
        setCurrencyError(true)
      } else {
        ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
        formikBag.resetForm()
        setCurrencyError(false)
      }
    },
  })

  const addOns = useMemo(() => {
    if (!data || !data?.addOns || !data?.addOns?.collection) return []

    return data?.addOns?.collection.map(({ id, name, amountCents, amountCurrency }) => {
      return {
        label: name,
        labelNode: (
          <Item>
            {name} -{' '}
            <Typography color="textPrimary">
              (
              {translate('text_629781ec7c6c1500d94fbc16', {
                amountWithCurrency: intlFormatNumber(
                  deserializeAmount(amountCents, amountCurrency) || 0,
                  {
                    currencyDisplay: 'symbol',
                    currency: amountCurrency,
                  }
                ),
              })}
              )
            </Typography>
          </Item>
        ),
        value: id,
      }
    })
  }, [data, translate])

  return (
    <Dialog
      ref={ref}
      title={translate('text_629781ec7c6c1500d94fbb00')}
      description={translate('text_629781ec7c6c1500d94fbb08')}
      onOpen={() => {
        if (!loading && !data) {
          getAddOns()
        }
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
              setCurrencyError(false)
            }}
          >
            {translate('text_629781ec7c6c1500d94fbb1c')}
          </Button>
          <Button disabled={!formikProps.isValid} onClick={formikProps.submitForm}>
            {translate('text_629781ec7c6c1500d94fbb24')}
          </Button>
        </>
      )}
    >
      <Container>
        <ComboBox
          value={formikProps.values.addOnId}
          label={translate('text_629781ec7c6c1500d94fbb0e')}
          data={addOns}
          loading={loading}
          searchQuery={getAddOns}
          placeholder={translate('text_629781ec7c6c1500d94fbb16')}
          onChange={(value) => {
            const addOn = data?.addOns?.collection.find((c) => c.id === value)

            if (!!addOn) {
              formikProps.setValues({
                addOnId: addOn.id,
                amountCents: deserializeAmount(addOn.amountCents, addOn.amountCurrency),
                amountCurrency: addOn.amountCurrency,
              })
            } else {
              formikProps.setFieldValue('addOnId', undefined)
            }
          }}
          PopperProps={{ displayInDialog: true }}
        />

        {!!formikProps.values.addOnId && (
          <LineAmount>
            <AmountInputField
              name="amountCents"
              currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
              beforeChangeFormatter={['positiveNumber']}
              label={translate('text_629781ec7c6c1500d94fbb04')}
              formikProps={formikProps}
            />
            <ComboBoxField
              name="amountCurrency"
              isEmptyNull={false}
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              disableClearable
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
            />
          </LineAmount>
        )}
        {currencyError && <Alert type="danger">{translate('text_632c88c97af78294bc02eaa1')}</Alert>}
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

AddAddOnToCustomerDialog.displayName = 'AddAddOnToCustomerDialog'
