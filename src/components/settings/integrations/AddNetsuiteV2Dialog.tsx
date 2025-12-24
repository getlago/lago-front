import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { GraphQLFormattedError } from 'graphql'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import { boolean, object, string } from 'yup'

import { Alert, Button, Chip, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { Checkbox, CheckboxField, TextInputField } from '~/components/form'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { NETSUITE_V2_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  CreateNetsuiteV2IntegrationInput,
  NetsuiteV2ForCreateDialogDialogFragment,
  useCreateNetsuiteV2IntegrationMutation,
  useUpdateNetsuiteV2IntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NetsuiteV2IntegrationDetailsTabs } from '~/pages/settings/NetsuiteV2IntegrationDetails'

import { DeleteNetsuiteV2IntegrationDialogRef } from './DeleteNetsuiteV2IntegrationDialog'

gql`
  fragment NetsuiteV2ForCreateDialogDialog on NetsuiteV2Integration {
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
    tokenId
    tokenSecret
  }

  mutation createNetsuiteV2Integration($input: CreateNetsuiteV2IntegrationInput!) {
    createNetsuiteV2Integration(input: $input) {
      ...NetsuiteV2ForCreateDialogDialog
    }
  }

  mutation updateNetsuiteV2Integration($input: UpdateNetsuiteV2IntegrationInput!) {
    updateNetsuiteV2Integration(input: $input) {
      ...NetsuiteV2ForCreateDialogDialog
    }
  }
`

type TAddNetsuiteV2DialogProps = Partial<{
  deleteModalRef: RefObject<DeleteNetsuiteV2IntegrationDialogRef>
  provider: NetsuiteV2ForCreateDialogDialogFragment
  deleteDialogCallback: () => void
}>

export interface AddNetsuiteV2DialogRef {
  openDialog: (props?: TAddNetsuiteV2DialogProps) => unknown
  closeDialog: () => unknown
}

export const AddNetsuiteV2Dialog = forwardRef<AddNetsuiteV2DialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddNetsuiteV2DialogProps | undefined>(undefined)
  const [showGlobalError, setShowGlobalError] = useState(false)
  const netsuiteProvider = localData?.provider
  const isEdition = !!netsuiteProvider

  const [createIntegration] = useCreateNetsuiteV2IntegrationMutation({
    onCompleted({ createNetsuiteV2Integration }) {
      if (createNetsuiteV2Integration?.id) {
        navigate(
          generatePath(NETSUITE_V2_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createNetsuiteV2Integration.id,
            tab: NetsuiteV2IntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2c4'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getNetsuiteV2IntegrationsList'],
  })

  const [updateIntegration] = useUpdateNetsuiteV2IntegrationMutation({
    onCompleted({ updateNetsuiteV2Integration }) {
      if (updateNetsuiteV2Integration?.id) {
        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2cc'),
          severity: 'success',
        })
      }
    },
  })

  const formikProps = useFormik<CreateNetsuiteV2IntegrationInput>({
    initialValues: {
      name: netsuiteProvider?.name || '',
      code: netsuiteProvider?.code || '',
      accountId: netsuiteProvider?.accountId || '',
      clientId: netsuiteProvider?.clientId || '',
      clientSecret: netsuiteProvider?.clientSecret || '',
      tokenId: netsuiteProvider?.tokenId || '',
      tokenSecret: netsuiteProvider?.tokenSecret || '',
      scriptEndpointUrl: netsuiteProvider?.scriptEndpointUrl || '',
      syncCreditNotes: !!netsuiteProvider?.syncCreditNotes,
      syncInvoices: !!netsuiteProvider?.syncInvoices,
      syncPayments: !!netsuiteProvider?.syncPayments,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      accountId: string().required(''),
      clientId: string().required(''),
      clientSecret: string().required(''),
      tokenId: string().required(''),
      tokenSecret: string().required(''),
      scriptEndpointUrl: string().url('').required(''),
      syncCreditNotes: boolean(),
      syncInvoices: boolean(),
      syncPayments: boolean(),
    }),
    onSubmit: async ({ ...values }, formikBag) => {
      setShowGlobalError(false)

      const handleError = (errors: readonly GraphQLFormattedError[]) => {
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
        const res = await createIntegration({
          variables: {
            input: { ...values },
          },
        })

        if (res.errors) {
          return handleError(res.errors)
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
        isEdition ? 'text_1766072494329cdczw6alxv7' : 'text_661ff6e56ef7e1b7c542b1d6',
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
          <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
        )}

        <Stack spacing={6}>
          <div className="flex flex-row items-start gap-6">
            <TextInputField
              className="flex-1"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={!isEdition}
              name="name"
              label={translate('text_6419c64eace749372fc72b0f')}
              placeholder={translate('text_6584550dc4cec7adf861504f')}
              formikProps={formikProps}
            />
            <TextInputField
              className="flex-1"
              name="code"
              beforeChangeFormatter="code"
              label={translate('text_62876e85e32e0300e1803127')}
              placeholder={translate('text_6584550dc4cec7adf8615053')}
              formikProps={formikProps}
            />
          </div>

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
          <TextInputField
            name="tokenId"
            disabled={isEdition}
            label={translate('text_6683cd0bab4ac0007e913af7')}
            placeholder={translate('text_6683cd1bb93b060070e9a596')}
            formikProps={formikProps}
          />
          <TextInputField
            name="tokenSecret"
            disabled={isEdition}
            label={translate('text_6683cd29cfb79500e588ee47')}
            placeholder={translate('text_6683cd3f33ac8f005b67345c')}
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
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  )
})

AddNetsuiteV2Dialog.displayName = 'AddNetsuiteV2Dialog'
