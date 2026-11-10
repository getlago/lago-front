import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { useNavigate } from '~/core/router'
import {
  CurrentUserInfosFragmentDoc,
  LagoApiError,
  SignupRoleEnum,
  SignupSourceEnum,
  useCreateSelfServeOrganizationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  CREATE_ORGANIZATION_NAME_ERRORS,
  createOrganizationValidationSchema,
  getCreateOrganizationDefaultValues,
} from './validationSchema'

import { getSignupBannerError, SIGNUP_GENERIC_ERROR } from '../common/signupErrors'
import {
  SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_NAME_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_SUBMIT_BUTTON_TEST_ID,
} from '../signUpTestIds'

gql`
  mutation createSelfServeOrganization($input: CreateSelfServeOrganizationInput!) {
    createSelfServeOrganization(input: $input) {
      landingOrganization {
        id
        slug
      }
      user {
        id
        ...CurrentUserInfos
      }
    }
  }

  ${CurrentUserInfosFragmentDoc}
`

const CREATE_ORGANIZATION_FORM_ID = 'self-serve-create-organization-form'

const ROLE_OPTIONS: Array<{ value: SignupRoleEnum; labelKey: string }> = [
  { value: SignupRoleEnum.Engineering, labelKey: 'text_1794312349027q01gklrukb9' },
  { value: SignupRoleEnum.Finance, labelKey: 'text_1794312349027w9negikvbap' },
  { value: SignupRoleEnum.Founder, labelKey: 'text_1794312349027rotmctl816r' },
  { value: SignupRoleEnum.ProductManagement, labelKey: 'text_1794312349027ru81ijdyxyo' },
  { value: SignupRoleEnum.Data, labelKey: 'text_17943123490272qxvjoq2f5w' },
  { value: SignupRoleEnum.Leadership, labelKey: 'text_1794312349027hm4a44alvlt' },
  { value: SignupRoleEnum.Other, labelKey: 'text_636d86cd9fd41b93c35bf1c7' },
]

const SOURCE_OPTIONS: Array<{ value: SignupSourceEnum; labelKey: string }> = [
  { value: SignupSourceEnum.AiSearch, labelKey: 'text_1794312349027tenh0ixawap' },
  { value: SignupSourceEnum.Github, labelKey: 'text_1794312349027cwiq47mr235' },
  { value: SignupSourceEnum.HackerNews, labelKey: 'text_17943123490274ojs356de43' },
  { value: SignupSourceEnum.Reference, labelKey: 'text_17370432002911cyzkxf966v' },
  { value: SignupSourceEnum.YCombinator, labelKey: 'text_1794312349027xqv3w3spna6' },
  { value: SignupSourceEnum.SearchEngine, labelKey: 'text_179431234902744m0x4c3qjl' },
  { value: SignupSourceEnum.Other, labelKey: 'text_636d86cd9fd41b93c35bf1c7' },
]

const NAME_ERRORS: Record<string, string> = {
  value_is_mandatory: CREATE_ORGANIZATION_NAME_ERRORS.REQUIRED,
  value_is_too_long: CREATE_ORGANIZATION_NAME_ERRORS.TOO_LONG,
  value_contains_link: CREATE_ORGANIZATION_NAME_ERRORS.CONTAINS_LINK,
}

const getNameError = (details: unknown): string | undefined => {
  if (typeof details !== 'object' || details === null || !('name' in details)) return undefined

  const codes = details.name

  if (!Array.isArray(codes)) return undefined

  return codes
    .map((code) => (typeof code === 'string' ? NAME_ERRORS[code] : undefined))
    .find(Boolean)
}

type CreateOrganizationFormProps = {
  email: string | undefined
  onUserNotEligible: () => Promise<void>
}

export const CreateOrganizationForm = ({
  email,
  onUserNotEligible,
}: CreateOrganizationFormProps): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [bannerError, setBannerError] = useState<string>()
  const [createOrganization] = useCreateSelfServeOrganizationMutation({
    context: { silentError: true },
  })

  const form = useAppForm({
    defaultValues: getCreateOrganizationDefaultValues(email),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: createOrganizationValidationSchema },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CREATE_ORGANIZATION_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      if (!value.role) return

      setBannerError(undefined)

      try {
        const result = await createOrganization({
          variables: {
            input: { name: value.name.trim(), role: value.role, source: value.source },
          },
        })

        const landingSlug = result.data?.createSelfServeOrganization?.landingOrganization.slug

        if (landingSlug) {
          navigate(`/${landingSlug}`, { replace: true, skipSlugPrepend: true })

          return
        }

        const extensions = result.errors?.[0]?.extensions
        const code = typeof extensions?.code === 'string' ? extensions.code : ''

        if (code === LagoApiError.UserNotEligible) {
          await onUserNotEligible()

          return
        }

        const nameError = getNameError(extensions?.details)

        if (code === LagoApiError.UnprocessableEntity && nameError) {
          formApi.setErrorMap({
            onDynamic: { fields: { name: { message: nameError, path: ['name'] } } },
          })

          return
        }

        setBannerError(getSignupBannerError(code))
      } catch {
        setBannerError(SIGNUP_GENERIC_ERROR)
      }
    },
  })

  const canCreate = useStore(
    form.store,
    (state) => !!state.values.name.trim() && !!state.values.role,
  )

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <form
      id={CREATE_ORGANIZATION_FORM_ID}
      className="flex flex-col gap-8"
      onSubmit={handleSubmit}
      noValidate
    >
      {!!bannerError && (
        <Alert type="danger" data-test={SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID}>
          {translate(bannerError)}
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <form.AppField name="name">
          {(field) => (
            <field.TextInputField
              label={translate('text_62a99ba2af7535cefacab49c')}
              placeholder={translate('text_660bf95c75dd928ced0ecb33')}
              data-test={SELF_SERVE_CREATE_ORGANIZATION_NAME_FIELD_TEST_ID}
            />
          )}
        </form.AppField>

        <form.AppField name="role">
          {(field) => (
            <field.ComboBoxField
              label={translate('text_17943123490262yeovor3alv')}
              placeholder={translate('text_1794315160489osu1v3u5vuj')}
              data={ROLE_OPTIONS.map(({ value, labelKey }) => ({
                value,
                label: translate(labelKey),
              }))}
              sortValues={false}
              dataTest={SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID}
            />
          )}
        </form.AppField>

        <form.AppField name="source">
          {(field) => (
            <field.ComboBoxField
              label={translate('text_1794312349026ei8cybp0gil')}
              placeholder={translate('text_1794315160489mogtgg7d90e')}
              data={SOURCE_OPTIONS.map(({ value, labelKey }) => ({
                value,
                label: translate(labelKey),
              }))}
              sortValues={false}
              dataTest={SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID}
            />
          )}
        </form.AppField>
      </div>

      <form.AppForm>
        <form.SubmitButton
          dataTest={SELF_SERVE_CREATE_ORGANIZATION_SUBMIT_BUTTON_TEST_ID}
          size="large"
          fullWidth
          disabled={!canCreate}
        >
          {translate('text_1794312349027nrtxp0i70i7')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
