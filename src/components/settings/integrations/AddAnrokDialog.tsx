import { FetchResult, gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useId, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { ANROK_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddAnrokIntegrationDialogFragment,
  AnrokIntegrationDetailsFragmentDoc,
  CreateAnrokIntegrationInput,
  CreateAnrokIntegrationMutation,
  LagoApiError,
  UpdateAnrokIntegrationMutation,
  useCreateAnrokIntegrationMutation,
  useUpdateAnrokIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { AnrokIntegrationDetailsTabs } from '~/pages/settings/AnrokIntegrationDetails'
import { theme } from '~/styles'

import { DeleteAnrokIntegrationDialogRef } from './DeleteAnrokIntegrationDialog'

gql`
  fragment AddAnrokIntegrationDialog on AnrokIntegration {
    id
    name
    code
    apiKey
  }

  mutation createAnrokIntegration($input: CreateAnrokIntegrationInput!) {
    createAnrokIntegration(input: $input) {
      id
      ...AddAnrokIntegrationDialog
      ...AnrokIntegrationDetails
    }
  }

  mutation updateAnrokIntegration($input: UpdateAnrokIntegrationInput!) {
    updateAnrokIntegration(input: $input) {
      id
      ...AddAnrokIntegrationDialog
      ...AnrokIntegrationDetails
    }
  }

  ${AnrokIntegrationDetailsFragmentDoc}
`

type TAddAnrokDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteAnrokIntegrationDialogRef>
  integration: AddAnrokIntegrationDialogFragment
  deleteDialogCallback: Function
}>

export interface AddAnrokDialogRef {
  openDialog: (props?: TAddAnrokDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddAnrokDialog = forwardRef<AddAnrokDialogRef>((_, ref) => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [localData, setLocalData] = useState<TAddAnrokDialogProps | undefined>(undefined)
  const anrokIntegration = localData?.integration
  const isEdition = !!anrokIntegration

  const [addAnrok] = useCreateAnrokIntegrationMutation({
    onCompleted({ createAnrokIntegration }) {
      if (createAnrokIntegration?.id) {
        navigate(
          generatePath(ANROK_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createAnrokIntegration.id,
            tab: AnrokIntegrationDetailsTabs.Settings,
          }),
        )

        addToast({
          message: translate('text_6668821d94e4da4dfd8b38e9'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateAnrokIntegrationMutation({
    onCompleted({ updateAnrokIntegration }) {
      if (updateAnrokIntegration?.id) {
        addToast({
          message: translate('text_6668821d94e4da4dfd8b38f3'),
          severity: 'success',
        })

        dialogRef.current?.closeDialog()
      }
    },
  })

  const formikProps = useFormik<Omit<CreateAnrokIntegrationInput, 'connectionId'>>({
    initialValues: {
      apiKey: anrokIntegration?.apiKey || '',
      code: anrokIntegration?.code || '',
      name: anrokIntegration?.name || '',
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      apiKey: string().required(''),
    }),
    onSubmit: async ({ apiKey, ...values }, formikBag) => {
      let res

      if (isEdition) {
        res = await updateApiKey({
          variables: {
            input: {
              id: anrokIntegration?.id || '',
              ...values,
            },
          },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })
      } else {
        const Nango = (await import('@nangohq/frontend')).default
        const connectionId = `anrok-${componentId.replaceAll(':', '')}-${Date.now()}`
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoApiKeyConnection = await nango.auth('anrok', connectionId, {
            credentials: {
              apiKey,
            },
          })

          res = await addAnrok({
            variables: {
              input: { ...values, apiKey, connectionId: nangoApiKeyConnection?.connectionId || '' },
            },
            context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
          })
        } catch (error) {}
      }

      const { errors } = res as
        | FetchResult<UpdateAnrokIntegrationMutation>
        | FetchResult<CreateAnrokIntegrationMutation>

      if (!errors) dialogRef.current?.closeDialog()

      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        formikBag.setErrors({
          code: translate('text_632a2d437e341dcc76817556'),
        })
      }
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
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_666887f6c4d092aa1e1a8477',
        {
          name: anrokIntegration?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_666889d43a2ea34eb2aa3e55' : 'text_666887f6c4d092aa1e1a8478',
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
                  provider: anrokIntegration,
                  callback: localData?.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_666887f6c4d092aa1e1a8477',
              )}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <Content>
        <InlineInputs>
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </InlineInputs>

        <TextInputField
          name="apiKey"
          disabled={isEdition}
          label={translate('text_6668821d94e4da4dfd8b38d5')}
          placeholder={translate('text_666887f6c4d092aa1e1a847e')}
          formikProps={formikProps}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineInputs = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing(6)};

  > * {
    flex: 1;
  }
`

AddAnrokDialog.displayName = 'AddAnrokDialog'
