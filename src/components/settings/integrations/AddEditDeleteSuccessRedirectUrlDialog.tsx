import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ADYEN_SUCCESS_LINK_SPEC_URL } from '~/core/constants/externalUrls'
import {
  AdyenForCreateAndEditSuccessRedirectUrlFragment,
  GocardlessForCreateAndEditSuccessRedirectUrlFragment,
  StripeForCreateAndEditSuccessRedirectUrlFragment,
  UpdateAdyenPaymentProviderInput,
  UpdateGocardlessPaymentProviderInput,
  UpdateStripePaymentProviderInput,
  useUpdateAdyenPaymentProviderMutation,
  useUpdateGocardlessPaymentProviderMutation,
  useUpdateStripePaymentProviderMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment AdyenForCreateAndEditSuccessRedirectUrl on AdyenProvider {
    id
    successRedirectUrl
  }

  fragment gocardlessForCreateAndEditSuccessRedirectUrl on GocardlessProvider {
    id
    successRedirectUrl
  }

  fragment stripeForCreateAndEditSuccessRedirectUrl on StripeProvider {
    id
    successRedirectUrl
  }

  mutation updateAdyenPaymentProvider($input: UpdateAdyenPaymentProviderInput!) {
    updateAdyenPaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateGocardlessPaymentProvider($input: UpdateGocardlessPaymentProviderInput!) {
    updateGocardlessPaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateStripePaymentProvider($input: UpdateStripePaymentProviderInput!) {
    updateStripePaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }
`

export const AddEditDeleteSuccessRedirectUrlDialogMode = {
  Add: 'Add',
  Edit: 'Edit',
  Delete: 'Delete',
} as const

export const AddEditDeleteSuccessRedirectUrlDialogProviderType = {
  Adyen: 'Adyen',
  Stripe: 'Stripe',
  GoCardless: 'GoCardless',
} as const

type LocalProviderType = {
  mode: keyof typeof AddEditDeleteSuccessRedirectUrlDialogMode
  type: keyof typeof AddEditDeleteSuccessRedirectUrlDialogProviderType
  provider?:
    | AdyenForCreateAndEditSuccessRedirectUrlFragment
    | GocardlessForCreateAndEditSuccessRedirectUrlFragment
    | StripeForCreateAndEditSuccessRedirectUrlFragment
    | null
}

export interface AddEditDeleteSuccessRedirectUrlDialogRef {
  openDialog: (incommingData?: LocalProviderType) => unknown
  closeDialog: () => unknown
}

export const AddEditDeleteSuccessRedirectUrlDialog =
  forwardRef<AddEditDeleteSuccessRedirectUrlDialogRef>((_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [localData, setLocalData] = useState<LocalProviderType | undefined>(undefined)
    const successToastMessage = translate(
      localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
        ? 'text_65367cb78324b77fcb6af2c1'
        : localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Add
        ? 'text_65367cb78324b77fcb6af261'
        : 'text_65367cb78324b77fcb6af28f'
    )
    const [updateAdyenProvider] = useUpdateAdyenPaymentProviderMutation({
      onCompleted(data) {
        if (data && data.updateAdyenPaymentProvider) {
          addToast({
            message: successToastMessage,
            severity: 'success',
          })
        }
      },
    })

    const [updateGocardlessProvider] = useUpdateGocardlessPaymentProviderMutation({
      onCompleted(data) {
        if (data && data.updateGocardlessPaymentProvider) {
          addToast({
            message: successToastMessage,
            severity: 'success',
          })
        }
      },
    })

    const [updateStripeProvider] = useUpdateStripePaymentProviderMutation({
      onCompleted(data) {
        if (data && data.updateStripePaymentProvider) {
          addToast({
            message: successToastMessage,
            severity: 'success',
          })
        }
      },
    })

    const formikProps = useFormik<
      | UpdateAdyenPaymentProviderInput
      | UpdateGocardlessPaymentProviderInput
      | UpdateStripePaymentProviderInput
    >({
      initialValues: {
        successRedirectUrl: localData?.provider?.successRedirectUrl || '',
      },
      validateOnMount: true,
      enableReinitialize: true,
      validationSchema: object().shape({
        successRedirectUrl: string().required(''),
      }),
      onSubmit: async ({ ...values }, formikBag) => {
        const methodLoojup = {
          [AddEditDeleteSuccessRedirectUrlDialogProviderType.Adyen]: updateAdyenProvider,
          [AddEditDeleteSuccessRedirectUrlDialogProviderType.Stripe]: updateStripeProvider,
          [AddEditDeleteSuccessRedirectUrlDialogProviderType.GoCardless]: updateGocardlessProvider,
        }

        const method = methodLoojup[localData?.type as LocalProviderType['type']]
        // localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Adyen
        //   ? updateAdyenProvider
        //   : localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Stripe
        //   ? updateStripeProvider
        //   : updateGocardlessProvider

        const res = await method({
          variables: {
            input: {
              successRedirectUrl:
                localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
                  ? null
                  : values.successRedirectUrl,
            },
          },
        })

        // if (localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Adyen) {
        // } else if (localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Stripe) {
        //   res = await updateStripeProvider({
        //     variables: {
        //       input: {
        //         successRedirectUrl:
        //           localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
        //             ? null
        //             : values.successRedirectUrl,
        //       },
        //     },
        //   })
        // } else if (
        //   localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.GoCardless
        // ) {
        //   res = await updateGocardlessProvider({
        //     variables: {
        //       input: {
        //         successRedirectUrl:
        //           localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
        //             ? null
        //             : values.successRedirectUrl,
        //       },
        //     },
        //   })
        // }

        if (res?.errors) {
          if (hasDefinedGQLError('UrlIsInvalid', res.errors)) {
            formikBag.setFieldError('successRedirectUrl', 'true')
          }
          return
        }

        dialogRef.current?.closeDialog()
      },
    })

    const helperText: string = useMemo(() => {
      if (!!formikProps.errors.successRedirectUrl) {
        if (localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Adyen) {
          return translate('text_65367cb78324b77fcb6af2eb', {
            href: ADYEN_SUCCESS_LINK_SPEC_URL,
          })
        }
        return translate('text_6538d6f6c43ecb00706e6ab6')
      }

      if (localData?.type === AddEditDeleteSuccessRedirectUrlDialogProviderType.Adyen) {
        return translate('text_65367cb78324b77fcb6af2e9', {
          href: ADYEN_SUCCESS_LINK_SPEC_URL,
        })
      }
      return translate('text_6538d6c00f753e0085cbd4ba')
    }, [formikProps.errors.successRedirectUrl, localData?.type, translate])

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        formikProps.resetForm()
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate(
          localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
            ? 'text_65367cb78324b77fcb6af200'
            : localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Edit
            ? 'text_65367cb78324b77fcb6af216'
            : 'text_65367cb78324b77fcb6af1b4'
        )}
        description={translate(
          localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
            ? 'text_65367cb78324b77fcb6af218'
            : 'text_65367cb78324b77fcb6af224',
          {
            connectionName: localData?.type,
          }
        )}
        onClose={() => {
          setLocalData(undefined)
          formikProps.resetForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6271200984178801ba8bdf4a')}
            </Button>
            <Button
              variant="primary"
              danger={localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete}
              disabled={
                localData?.mode !== AddEditDeleteSuccessRedirectUrlDialogMode.Delete &&
                (!formikProps.isValid || !formikProps.dirty)
              }
              onClick={async () => {
                await formikProps.submitForm()
              }}
            >
              {translate(
                localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Delete
                  ? 'text_65367cb78324b77fcb6af255'
                  : localData?.mode === AddEditDeleteSuccessRedirectUrlDialogMode.Edit
                  ? 'text_65367cb78324b77fcb6af249'
                  : 'text_65367cb78324b77fcb6af1ec'
              )}
            </Button>
          </>
        )}
      >
        {localData?.mode !== AddEditDeleteSuccessRedirectUrlDialogMode.Delete && (
          <Content>
            <TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              error={!!formikProps.errors.successRedirectUrl}
              name="successRedirectUrl"
              label={translate('text_65367cb78324b77fcb6af1c6')}
              placeholder={translate('text_65367cb78324b77fcb6af1d0')}
              helperText={
                <Typography
                  variant="caption"
                  color={!!formikProps.errors.successRedirectUrl ? 'danger600' : 'grey600'}
                  html={helperText}
                />
              }
              formikProps={formikProps}
            />
          </Content>
        )}
      </Dialog>
    )
  })

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddEditDeleteSuccessRedirectUrlDialog.displayName = 'forwardRef'
