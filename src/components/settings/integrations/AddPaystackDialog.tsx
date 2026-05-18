import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { object, string } from 'yup'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PAYSTACK_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddPaystackPaymentProviderInput,
  LagoApiError,
  PaystackIntegrationDetailsFragment,
  useAddPaystackPaymentProviderMutation,
  useGetProviderByCodeForPaystackLazyQuery,
  useUpdatePaystackPaymentProviderMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { DeletePaystackIntegrationDialogRef } from './DeletePaystackIntegrationDialog'

gql`
  fragment AddPaystackProviderDialog on PaystackProvider {
    id
    name
    code
    secretKey
    successRedirectUrl
  }

  query getProviderByCodeForPaystack($code: String) {
    paymentProvider(code: $code) {
      ... on FlutterwaveProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on AdyenProvider {
        id
      }
      ... on StripeProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
      ... on PaystackProvider {
        id
      }
    }
  }

  mutation addPaystackPaymentProvider($input: AddPaystackPaymentProviderInput!) {
    addPaystackPaymentProvider(input: $input) {
      id
      ...AddPaystackProviderDialog
    }
  }

  mutation updatePaystackPaymentProvider($input: UpdatePaystackPaymentProviderInput!) {
    updatePaystackPaymentProvider(input: $input) {
      id
      ...AddPaystackProviderDialog
    }
  }
`

type TAddPaystackDialogProps = Partial<{
  deleteModalRef: RefObject<DeletePaystackIntegrationDialogRef>
  provider: PaystackIntegrationDetailsFragment
  deleteDialogCallback: () => void
}>

export interface AddPaystackDialogRef {
  openDialog: (props?: TAddPaystackDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddPaystackDialog = forwardRef<AddPaystackDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddPaystackDialogProps | undefined>(undefined)
  const paystackProvider = localData?.provider
  const isEdition = !!paystackProvider

  const [addPaystackProvider] = useAddPaystackPaymentProviderMutation({
    onCompleted(data) {
      if (data?.addPaystackPaymentProvider) {
        addToast({
          severity: 'success',
          translateKey: 'text_1777918719746ystjjipgfes',
        })
        navigate(
          generatePath(PAYSTACK_INTEGRATION_DETAILS_ROUTE, {
            integrationId: data.addPaystackPaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
      }
    },
    onError() {
      addToast({
        severity: 'danger',
        translateKey: 'text_629728388c4d2300e2d380d5',
      })
    },
  })
  const [updatePaystackProvider] = useUpdatePaystackPaymentProviderMutation({
    onCompleted(data) {
      if (data?.updatePaystackPaymentProvider) {
        addToast({
          severity: 'success',
          translateKey: 'text_17779187197468w6ryc8oyug',
        })
      }
    },
    onError() {
      addToast({
        severity: 'danger',
        translateKey: 'text_629728388c4d2300e2d380d5',
      })
    },
  })
  const [getProviderByCode] = useGetProviderByCodeForPaystackLazyQuery()

  const formikProps = useFormik<AddPaystackPaymentProviderInput>({
    initialValues: {
      name: paystackProvider?.name || '',
      code: paystackProvider?.code || '',
      secretKey: paystackProvider?.secretKey || '',
      successRedirectUrl: paystackProvider?.successRedirectUrl || '',
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      secretKey: string().required(''),
      successRedirectUrl: string().url(''),
    }),
    onSubmit: async (values, formikBag) => {
      const { name, code, secretKey, successRedirectUrl } = values

      const res = await getProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== paystackProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updatePaystackProvider({
          variables: {
            input: {
              id: paystackProvider?.id || '',
              name,
              code,
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      } else {
        await addPaystackProvider({
          variables: {
            input: {
              name,
              code,
              secretKey,
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      }

      dialogRef.current?.closeDialog()
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(
        isEdition ? 'text_1777918719746j08zl7ss77c' : 'text_177791871974582yz2oec7in',
      )}
      description={translate('text_1777918719746zp4eauk5br2')}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <div className="flex w-full items-center gap-3">
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: paystackProvider,
                  callback: localData?.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_177791871974582yz2oec7in',
              )}
            </Button>
          </div>
        </div>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-start gap-6">
          <TextInputField
            className="flex-1"
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            className="flex-1"
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </div>
        <TextInputField
          name="secretKey"
          disabled={isEdition}
          label={translate('text_17497252876688ai900wowoc')}
          placeholder={translate('text_177791871974610eoawd1lvy')}
          formikProps={formikProps}
        />
        <TextInputField
          formikProps={formikProps}
          name="successRedirectUrl"
          label={translate('text_65367cb78324b77fcb6af21c')}
          placeholder={translate('text_1733303818769298k0fvsgcz')}
        />
      </div>
    </Dialog>
  )
})

AddPaystackDialog.displayName = 'AddPaystackDialog'
