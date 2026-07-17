import { gql } from '@apollo/client'
import { z } from 'zod'

import { zodDomain, zodOptionalHost } from '~/formValidation/zodCustoms'
import {
  AddOktaIntegrationDialogFragment,
  AuthenticationMethodsEnum,
  CreateOktaIntegrationInput,
  DeleteOktaIntegrationDialogFragmentDoc,
  useCreateOktaIntegrationMutation,
  useUpdateOktaIntegrationMutation,
} from '~/generated/graphql'

import { SSOIntegrationField, useAddSSOIntegrationDialog } from './AddSSOIntegrationDialog'

gql`
  fragment AddOktaIntegrationDialog on OktaIntegration {
    id
    domain
    clientId
    clientSecret
    organizationName
    host
    ...DeleteOktaIntegrationDialog
  }

  mutation createOktaIntegration($input: CreateOktaIntegrationInput!) {
    createOktaIntegration(input: $input) {
      id
    }
  }

  mutation updateOktaIntegration($input: UpdateOktaIntegrationInput!) {
    updateOktaIntegration(input: $input) {
      id
    }
  }

  ${DeleteOktaIntegrationDialogFragmentDoc}
`

const ADD_OKTA_FORM_ID = 'form-add-okta-integration'

export const OKTA_INTEGRATION_SUBMIT_BTN = 'add-okta-dialog-submit-button'

const defaultFormValues: CreateOktaIntegrationInput = {
  domain: '',
  host: '',
  clientId: '',
  clientSecret: '',
  organizationName: '',
}

const validationSchema = z.object({
  domain: zodDomain,
  host: zodOptionalHost,
  clientId: z.string(),
  clientSecret: z.string(),
  organizationName: z.string(),
})

const fields: SSOIntegrationField<CreateOktaIntegrationInput>[] = [
  {
    name: 'domain',
    autoFocus: true,
    labelKey: 'text_664c732c264d7eed1c74fd94',
    placeholderKey: 'text_664c732c264d7eed1c74fd9a',
    helperKey: 'text_664c732c264d7eed1c74fda0',
  },
  {
    name: 'host',
    labelKey: 'text_664c732c264d7eed1c74fdd0',
    placeholderKey: 'text_664c732c264d7eed1c74fdd1',
  },
  {
    name: 'clientId',
    labelKey: 'text_664c732c264d7eed1c74fda6',
    placeholderKey: 'text_664c732c264d7eed1c74fdac',
  },
  {
    name: 'clientSecret',
    labelKey: 'text_664c732c264d7eed1c74fdb2',
    placeholderKey: 'text_664c732c264d7eed1c74fdb7',
  },
  {
    name: 'organizationName',
    labelKey: 'text_664c732c264d7eed1c74fdbb',
    placeholderKey: 'text_664c732c264d7eed1c74fdbf',
    endAdornmentKey: 'text_664c732c264d7eed1c74fdc3',
  },
]

export const useAddOktaDialog = () => {
  const { openDialog } = useAddSSOIntegrationDialog({
    formId: ADD_OKTA_FORM_ID,
    submitBtnTestId: OKTA_INTEGRATION_SUBMIT_BTN,
    authenticationMethod: AuthenticationMethodsEnum.Okta,
    integrationTypename: 'OktaIntegration',
    defaultFormValues,
    validationSchema,
    fields,
    useCreateIntegrationMutation: useCreateOktaIntegrationMutation,
    useUpdateIntegrationMutation: useUpdateOktaIntegrationMutation,
    getCreatedIntegrationId: (data) => data?.createOktaIntegration?.id,
    getUpdatedIntegrationId: (data) => data?.updateOktaIntegration?.id,
    setFormValuesFromIntegration: (
      integration: AddOktaIntegrationDialogFragment,
      setFieldValue,
    ) => {
      setFieldValue('domain', integration.domain || '')
      setFieldValue('host', integration.host || '')
      setFieldValue('clientId', integration.clientId || '')
      setFieldValue('clientSecret', integration.clientSecret || '')
      setFieldValue('organizationName', integration.organizationName || '')
    },
    translations: {
      createTitle: 'text_664c732c264d7eed1c74fd88',
      editTitle: 'text_664c8fa719b5e7ad81c86018',
      createDescription: 'text_664c732c264d7eed1c74fd8e',
      editDescription: 'text_664c8fa719b5e7ad81c86019',
      createSubmit: 'text_664c732c264d7eed1c74fdcb',
      createSuccess: 'text_664c732c264d7eed1c74fde6',
      updateSuccess: 'text_664c732c264d7eed1c74fde8',
      integrationName: 'text_664c732c264d7eed1c74fda2',
      deleteDialogTitle: 'text_664c900d2d312a01546bd84b',
      deleteDialogDescription: 'text_664c900d2d312a01546bd84c',
      deleteSuccess: 'text_664c732c264d7eed1c74fdb4',
    },
  })

  return { openAddOktaDialog: openDialog }
}
