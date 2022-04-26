import { forwardRef, useEffect, RefObject } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { useFormik } from 'formik'
import { object, string } from 'yup'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import { addToast, LagoGQLError } from '~/core/apolloClient'
import { theme } from '~/styles'
import {
  useCreateCustomerMutation,
  CustomerItemFragmentDoc,
  AddCustomerDialogFragment,
  AddCustomerDialogDetailFragment,
  useUpdateCustomerMutation,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerDialogDetailFragmentDoc,
  Lago_Api_Error,
} from '~/generated/graphql'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'

export interface AddCustomerDialogRef extends DialogRef {}

gql`
  fragment AddCustomerDialog on Customer {
    id
    name
    customerId
    canBeDeleted
  }

  fragment AddCustomerDialogDetail on CustomerDetails {
    id
    name
    customerId
    canBeDeleted
  }

  mutation createCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...AddCustomerDialog
      ...CustomerItem
    }
  }

  mutation updateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ...AddCustomerDialog
      ...CustomerItem
    }
  }

  ${CustomerItemFragmentDoc}
`

interface AddCustomerDialogProps {
  customer?: AddCustomerDialogFragment | AddCustomerDialogDetailFragment | null
}

export const AddCustomerDialog = forwardRef<DialogRef, AddCustomerDialogProps>(
  ({ customer }: AddCustomerDialogProps, ref) => {
    const { translate } = useI18nContext()
    const navigate = useNavigate()
    const [create] = useCreateCustomerMutation({
      context: { silentErrorCode: [Lago_Api_Error.UnprocessableEntity] },
      onCompleted({ createCustomer }) {
        if (!!createCustomer) {
          addToast({
            message: translate('text_6250304370f0f700a8fdc295'),
            severity: 'success',
          })
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: createCustomer.id }))
        }
      },
    })
    const [update] = useUpdateCustomerMutation({
      onCompleted({ updateCustomer }) {
        if (!!updateCustomer) {
          addToast({
            message: translate('text_626162c62f790600f850b7da'),
            severity: 'success',
          })
        }
      },
      update(cache, { data }) {
        if (!data?.updateCustomer) return

        cache.writeFragment({
          data: { ...data?.updateCustomer, __typename: 'CustomerDetails' },
          fragment: AddCustomerDialogDetailFragmentDoc,
        })
      },
    })

    const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
      initialValues: {
        name: customer?.name ?? '',
        customerId: customer?.customerId ?? '',
      },
      validationSchema: object().shape({
        name: string().required(''),
        customerId: string().required(''),
      }),
      onSubmit: async (values, formikBag) => {
        let answer = undefined

        if (isEdition) {
          answer = await update({
            variables: { input: { id: customer?.id as string, ...values } },
          })
        } else {
          answer = await create({ variables: { input: values } })
        }

        const { errors } = answer

        const error = !errors ? undefined : (errors[0]?.extensions as LagoGQLError['extensions'])

        if (
          !!error &&
          error?.code === Lago_Api_Error.UnprocessableEntity &&
          !!error?.details?.customerId
        ) {
          formikBag.setFieldError('customerId', translate('text_626162c62f790600f850b728'))
        } else {
          ;(ref as unknown as RefObject<DialogRef>)?.current?.closeDialog()
          !isEdition && formikBag.resetForm()
        }
      },
    })
    const isEdition = !!customer

    useEffect(() => {
      formikProps.setValues({ name: customer?.name ?? '', customerId: customer?.customerId ?? '' })
    }, [customer])

    return (
      <Dialog
        ref={ref}
        title={translate(
          isEdition ? 'text_6261712bff79eb00ed02906f' : 'text_624efab67eb2570101d117ad'
        )}
        description={!isEdition && translate('text_624efab67eb2570101d117b5')}
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
            <Button
              disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
              onClick={async () => {
                await formikProps.handleSubmit()
                // closeDialog()
              }}
            >
              {translate(
                isEdition ? 'text_6261712bff79eb00ed02907b' : 'text_624efab67eb2570101d117eb'
              )}
            </Button>
          </>
        )}
      >
        <Content>
          <TextInputField
            name="name"
            label={translate('text_624efab67eb2570101d117be')}
            placeholder={translate('text_624efab67eb2570101d117c6')}
            formikProps={formikProps}
          />
          <TextInputField
            name="customerId"
            disabled={isEdition && !customer?.canBeDeleted}
            label={translate('text_624efab67eb2570101d117ce')}
            placeholder={translate('text_624efab67eb2570101d117d6')}
            helperText={
              (!isEdition || customer?.canBeDeleted) && translate('text_624efab67eb2570101d117de')
            }
            formikProps={formikProps}
          />
        </Content>
      </Dialog>
    )
  }
)

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(8)};
  }
`

AddCustomerDialog.displayName = 'AddCustomerDialog'
