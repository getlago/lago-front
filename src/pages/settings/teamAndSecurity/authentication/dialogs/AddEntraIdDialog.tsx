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
    additionalDomains
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
      ...AddEntraIdIntegrationDialog
    }
  }

  ${DeleteEntraIdIntegrationDialogFragmentDoc}
`

const ADD_ENTRA_ID_FORM_ID = 'form-add-entra-id-integration'

export const ENTRA_ID_INTEGRATION_SUBMIT_BTN = 'add-entra-id-dialog-submit-button'

const defaultFormValues: CreateEntraIdIntegrationInput = {
  domain: '',
  additionalDomains: [],
  host: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
}

const validationSchema = z.object({
  domain: zodDomain,
  additionalDomains: z
    .array(z.string())
    .refine(
      (domains) => domains.every((domain) => zodDomain.safeParse(domain).success),
      'text_664c732c264d7eed1c74fe03',
    ),
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
    name: 'additionalDomains',
    type: 'list',
    labelKey: 'text_1790959050606st0sfgsyq08',
    placeholderKey: 'text_1790959050607ii8cfyhk6v2',
    helperKey: 'text_1790959050607s5l0xu9h04v',
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
    editHelperKey: 'text_1790812800000h2k6wsj8x4q',
    password: true,
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
      setFieldValue('additionalDomains', integration.additionalDomains ?? [])
      setFieldValue('host', integration.host || '')
      setFieldValue('clientId', integration.clientId || '')
      setFieldValue('tenantId', integration.tenantId || '')
    },
    translations: {
      createTitle: 'text_1784307344255w8by29g8nm6',
      editTitle: 'text_1784307344255fc26gfvrmb5',
      createDescription: 'text_1784307344255lwooki6f5o9',
      editDescription: 'text_17843073442551nurtvrqz3y',
      createSubmit: 'text_17843073442559h8ul6r7wf1',
      createSuccess: 'text_664c732c264d7eed1c74fde6',
      updateSuccess: 'text_664c732c264d7eed1c74fde8',
      integrationName: 'text_17843073442548zt904xoinv',
      deleteDialogTitle: 'text_1784307344255lgty3uwoghl',
      deleteDialogDescription: 'text_17843073442556cjrcl7drw6',
      deleteSuccess: 'text_664c732c264d7eed1c74fdb4',
    },
  })

  return { openAddEntraIdDialog: openDialog }
}
