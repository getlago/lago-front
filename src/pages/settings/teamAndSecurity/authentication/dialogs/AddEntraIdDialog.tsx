import { gql } from '@apollo/client'
import { z } from 'zod'

import { zodDomain, zodOptionalHost } from '~/formValidation/zodCustoms'
import {
  AddEntraIdIntegrationDialogFragment,
  AuthenticationMethodsEnum,
  CreateEntraIdIntegrationInput,
  DeleteEntraIdIntegrationDialogFragmentDoc,
  useCreateEntraIdIntegrationMutation,
  useUpdateEntraIdIntegrationMutation,
} from '~/generated/graphql'

import { SSOIntegrationField, useAddSSOIntegrationDialog } from './AddSSOIntegrationDialog'

gql`
  fragment AddEntraIdIntegrationDialog on EntraIdIntegration {
    id
    domain
    clientId
    clientSecret
    tenantId
    host
    ...DeleteEntraIdIntegrationDialog
  }

  mutation createEntraIdIntegration($input: CreateEntraIdIntegrationInput!) {
    createEntraIdIntegration(input: $input) {
      id
    }
  }

  mutation updateEntraIdIntegration($input: UpdateEntraIdIntegrationInput!) {
    updateEntraIdIntegration(input: $input) {
      id
    }
  }

  ${DeleteEntraIdIntegrationDialogFragmentDoc}
`

const ADD_ENTRA_ID_FORM_ID = 'form-add-entra-id-integration'

export const ENTRA_ID_INTEGRATION_SUBMIT_BTN = 'add-entra-id-dialog-submit-button'

const defaultFormValues: CreateEntraIdIntegrationInput = {
  domain: '',
  host: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
}

const validationSchema = z.object({
  domain: zodDomain,
  host: zodOptionalHost,
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
})

const fields: SSOIntegrationField<CreateEntraIdIntegrationInput>[] = [
  {
    name: 'domain',
    autoFocus: true,
    labelKey: 'text_1784307344255m1d8phj5f9r',
    placeholderKey: 'text_1784307344255j97hb85e9r0',
    helperKey: 'text_1784307344255lryszig50wc',
  },
  {
    name: 'host',
    labelKey: 'text_17843073442557gr1lnot7cr',
    placeholderKey: 'text_1784307344255q2974p1d3gs',
  },
  {
    name: 'clientId',
    labelKey: 'text_17843073442552x8gcpunesv',
    placeholderKey: 'text_1784307344255kkmg7664unz',
  },
  {
    name: 'clientSecret',
    labelKey: 'text_17843073442551xjnrw1h4bc',
    placeholderKey: 'text_1784307344255ofy9u1w0hqh',
  },
  {
    name: 'tenantId',
    labelKey: 'text_1784307344255tyzraziy4d1',
    placeholderKey: 'text_1784307344255xv4zgs56gin',
  },
]

export const useAddEntraIdDialog = () => {
  const { openDialog } = useAddSSOIntegrationDialog({
    formId: ADD_ENTRA_ID_FORM_ID,
    submitBtnTestId: ENTRA_ID_INTEGRATION_SUBMIT_BTN,
    authenticationMethod: AuthenticationMethodsEnum.EntraId,
    integrationTypename: 'EntraIdIntegration',
    defaultFormValues,
    validationSchema,
    fields,
    useCreateIntegrationMutation: useCreateEntraIdIntegrationMutation,
    useUpdateIntegrationMutation: useUpdateEntraIdIntegrationMutation,
    getCreatedIntegrationId: (data) => data?.createEntraIdIntegration?.id,
    getUpdatedIntegrationId: (data) => data?.updateEntraIdIntegration?.id,
    setFormValuesFromIntegration: (
      integration: AddEntraIdIntegrationDialogFragment,
      setFieldValue,
    ) => {
      setFieldValue('domain', integration.domain || '')
      setFieldValue('host', integration.host || '')
      setFieldValue('clientId', integration.clientId || '')
      setFieldValue('clientSecret', integration.clientSecret || '')
      setFieldValue('tenantId', integration.tenantId || '')
    },
    translations: {
      createTitle: 'text_1784307344255w8by29g8nm6',
      editTitle: 'text_1784307344255fc26gfvrmb5',
      createDescription: 'text_1784307344255lwooki6f5o9',
      editDescription: 'text_17843073442551nurtvrqz3y',
      createSubmit: 'text_17843073442559h8ul6r7wf1',
      createSuccess: 'text_17843073442557vlbdr7do0l',
      updateSuccess: 'text_1784307344255zrzb2qqjiig',
      integrationName: 'text_17843073442548zt904xoinv',
      deleteDialogTitle: 'text_1784307344255lgty3uwoghl',
      deleteDialogDescription: 'text_17843073442556cjrcl7drw6',
      deleteSuccess: 'text_17843073442557u380a217wd',
    },
  })

  return { openAddEntraIdDialog: openDialog }
}
