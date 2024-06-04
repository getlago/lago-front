import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import Nango from '@nangohq/frontend'
import { useFormik } from 'formik'
import { GraphQLError } from 'graphql'
import { forwardRef, RefObject, useId, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { boolean, object, string } from 'yup'

import { Alert, Button, Chip, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { Checkbox, CheckboxField, TextInputField } from '~/components/form'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { NETSUITE_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  CreateNetsuiteIntegrationInput,
  NetsuiteForCreateDialogDialogFragment,
  useCreateNetsuiteIntegrationMutation,
  useUpdateNetsuiteIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NetsuiteIntegrationDetailsTabs } from '~/pages/settings/NetsuiteIntegrationDetails'
import { theme } from '~/styles'

import { DeleteNetsuiteIntegrationDialogRef } from './DeleteNetsuiteIntegrationDialog'

gql`
  fragment NetsuiteForCreateDialogDialog on NetsuiteIntegration {
    id
    accountId
    clientId
    clientSecret
    code
    name
    scriptEndpointUrl
    syncCreditNotes
    syncInvoices
    syncPayments
    syncSalesOrders
  }

  mutation createNetsuiteIntegration($input: CreateNetsuiteIntegrationInput!) {
    createNetsuiteIntegration(input: $input) {
      ...NetsuiteForCreateDialogDialog
    }
  }

  mutation updateNetsuiteIntegration($input: UpdateNetsuiteIntegrationInput!) {
    updateNetsuiteIntegration(input: $input) {
      ...NetsuiteForCreateDialogDialog
    }
  }
`

type TAddNetsuiteDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteNetsuiteIntegrationDialogRef>
  provider: NetsuiteForCreateDialogDialogFragment
  deleteDialogCallback: Function
}>

export interface AddNetsuiteDialogRef {
  openDialog: (props?: TAddNetsuiteDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddNetsuiteDialog = forwardRef<AddNetsuiteDialogRef>((_, ref) => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddNetsuiteDialogProps | undefined>(undefined)
  const [showGlobalError, setShowGlobalError] = useState(false)
  const netsuiteProvider = localData?.provider
  const isEdition = !!netsuiteProvider

  const [createIntegration] = useCreateNetsuiteIntegrationMutation({
    onCompleted({ createNetsuiteIntegration }) {
      if (createNetsuiteIntegration?.id) {
        navigate(
          generatePath(NETSUITE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createNetsuiteIntegration.id,
            tab: NetsuiteIntegrationDetailsTabs.Settings,
          }),
        )

        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2c4'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getNetsuiteIntegrationsList'],
  })

  const [updateIntegration] = useUpdateNetsuiteIntegrationMutation({
    onCompleted({ updateNetsuiteIntegration }) {
      if (updateNetsuiteIntegration?.id) {
        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2cc'),
          severity: 'success',
        })
      }
    },
  })

  const formikProps = useFormik<Omit<CreateNetsuiteIntegrationInput, 'connectionId'>>({
    initialValues: {
      name: netsuiteProvider?.name || '',
      code: netsuiteProvider?.code || '',
      accountId: netsuiteProvider?.accountId || '',
      clientId: netsuiteProvider?.clientId || '',
      clientSecret: netsuiteProvider?.clientSecret || '',
      scriptEndpointUrl: netsuiteProvider?.scriptEndpointUrl || '',
      syncCreditNotes: !!netsuiteProvider?.syncCreditNotes,
      syncInvoices: !!netsuiteProvider?.syncInvoices,
      syncPayments: !!netsuiteProvider?.syncPayments,
      syncSalesOrders: !!netsuiteProvider?.syncSalesOrders,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      accountId: string().required(''),
      clientId: string().required(''),
      clientSecret: string().required(''),
      scriptEndpointUrl: string().url('').required(''),
      syncCreditNotes: boolean(),
      syncInvoices: boolean(),
      syncPayments: boolean(),
      syncSalesOrders: boolean(),
    }),
    onSubmit: async ({ ...values }, formikBag) => {
      setShowGlobalError(false)

      const handleError = (errors: readonly GraphQLError[]) => {
        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          formikBag.setErrors({
            code: translate('text_632a2d437e341dcc76817556'),
          })

          // Scroll to top of modal container
          const modalContainer = document.getElementsByClassName('MuiDialog-container')[0]

          if (modalContainer) {
            modalContainer.scrollTo({ top: 0 })
          }
        }
      }

      if (isEdition) {
        const res = await updateIntegration({
          variables: {
            input: {
              ...values,
              id: netsuiteProvider?.id || '',
            },
          },
        })

        if (res.errors) {
          return handleError(res.errors)
        }
      } else {
        const connectionId = `${componentId.replaceAll(':', '')}-${Date.now()}`
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoAuthResult = await nango.auth('netsuite', connectionId, {
            params: { accountId: values.accountId },
            credentials: {
              oauth_client_id_override: values.clientId,
              oauth_client_secret_override: values.clientSecret,
            },
          })

          if (!!nangoAuthResult) {
            const res = await createIntegration({
              variables: {
                input: { ...values, connectionId },
              },
            })

            if (res.errors) {
              return handleError(res.errors)
            }
          }
        } catch (error) {
          setShowGlobalError(true)
          return
        }
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
        isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_661ff6e56ef7e1b7c542b326',
        {
          name: netsuiteProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_661ff6e56ef7e1b7c542b1da' : 'text_661ff6e56ef7e1b7c542b1d6',
      )}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width={isEdition ? '100%' : 'inherit'}
          spacing={3}
        >
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: netsuiteProvider,
                  callback: localData.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_661ff6e56ef7e1b7c542b326',
              )}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <Stack spacing={8} marginBottom={8}>
        {!!showGlobalError && (
          <Alert type="danger">{translate('text_62b31e1f6a5b8b1b745ece48')}</Alert>
        )}

        <Stack spacing={6}>
          <InlineInputs>
            <TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={!isEdition}
              name="name"
              label={translate('text_6419c64eace749372fc72b0f')}
              placeholder={translate('text_6584550dc4cec7adf861504f')}
              formikProps={formikProps}
            />
            <TextInputField
              name="code"
              beforeChangeFormatter="code"
              label={translate('text_62876e85e32e0300e1803127')}
              placeholder={translate('text_6584550dc4cec7adf8615053')}
              formikProps={formikProps}
            />
          </InlineInputs>

          <TextInputField
            name="accountId"
            beforeChangeFormatter={['lowercase', 'trim', 'dashSeparator']}
            disabled={isEdition}
            label={translate('text_661ff6e56ef7e1b7c542b216')}
            placeholder={translate('text_661ff6e56ef7e1b7c542b224')}
            formikProps={formikProps}
          />
          <TextInputField
            name="clientId"
            disabled={isEdition}
            label={translate('text_661ff6e56ef7e1b7c542b230')}
            placeholder={translate('text_661ff6e56ef7e1b7c542b23b')}
            formikProps={formikProps}
          />
          <TextInputField
            name="clientSecret"
            disabled={isEdition}
            label={translate('text_661ff6e56ef7e1b7c542b247')}
            placeholder={translate('text_661ff6e56ef7e1b7c542b251')}
            formikProps={formikProps}
          />
        </Stack>

        <Stack spacing={6}>
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_661ff6e56ef7e1b7c542b25b')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_661ff6e56ef7e1b7c542b267')}
            </Typography>
          </div>

          <TextInputField
            name="scriptEndpointUrl"
            label={translate('text_661ff6e56ef7e1b7c542b271')}
            placeholder={translate('text_661ff6e56ef7e1b7c542b27d')}
            formikProps={formikProps}
            error={undefined} // Make sure to remove yup default error
          />
        </Stack>

        <Stack spacing={6}>
          <div>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_661ff6e56ef7e1b7c542b286')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_661ff6e56ef7e1b7c542b28e')}
            </Typography>
          </div>

          <Stack spacing={4}>
            <Checkbox
              disabled
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b2a6')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              value={true}
            />
            <Checkbox
              disabled
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b2c2')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              value={true}
            />
            <Checkbox
              disabled
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b2d7')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              value={true}
            />
            <CheckboxField
              name="syncCreditNotes"
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b2e9')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              formikProps={formikProps}
            />
            <CheckboxField
              name="syncInvoices"
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b2ff')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              formikProps={formikProps}
            />
            <CheckboxField
              name="syncPayments"
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b311')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              formikProps={formikProps}
            />
            <CheckboxField
              name="syncSalesOrders"
              label={
                <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap">
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b296')}
                  </Typography>
                  <Chip
                    size="small"
                    label={translate('text_661ff6e56ef7e1b7c542b31e')}
                    color="danger600"
                  />
                  <Typography variant="body" color="grey700">
                    {translate('text_661ff6e56ef7e1b7c542b29e')}
                  </Typography>
                </Stack>
              }
              formikProps={formikProps}
            />
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  )
})

const InlineInputs = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing(6)};

  > * {
    flex: 1;
  }
`

AddNetsuiteDialog.displayName = 'AddNetsuiteDialog'
