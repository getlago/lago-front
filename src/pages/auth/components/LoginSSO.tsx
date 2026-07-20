import { MutationHookOptions, MutationTuple, OperationVariables } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { revalidateLogic } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { LOGIN_ROUTE, useLocation } from '~/core/router'
import { setItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import { zodRequiredEmail } from '~/formValidation/zodCustoms'
import { LagoApiError } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { Card, Page, StyledLogo } from '~/styles/auth'

const loginSSOValidationSchema = z.object({
  email: zodRequiredEmail,
})

const loginSSODefaultValues: z.infer<typeof loginSSOValidationSchema> = {
  email: '',
}

type SSOAuthorizeVariables = { input: { email: string } }

export type LoginSSOProps<TData, TVariables extends SSOAuthorizeVariables & OperationVariables> = {
  /** Provider authorize mutation hook (e.g. useFetchOktaAuthorizeUrlMutation). */
  useAuthorizeMutation: (
    baseOptions?: MutationHookOptions<TData, TVariables>,
  ) => MutationTuple<TData, TVariables>
  /** Selects the authorize url from the mutation data (e.g. data.oktaAuthorize.url). */
  getAuthorizeUrl: (data: TData | null | undefined) => string | null | undefined
  /** Maps an error code to the translation key to display. */
  getErrorKey: (code: LagoApiError) => string
  titleKey: string
  subtitleKey: string
  footerKey: string
  errorAlertDataTest: string
}

export const LoginSSO = <TData, TVariables extends SSOAuthorizeVariables & OperationVariables>({
  useAuthorizeMutation,
  getAuthorizeUrl,
  getErrorKey,
  titleKey,
  subtitleKey,
  footerKey,
  errorAlertDataTest,
}: LoginSSOProps<TData, TVariables>) => {
  const { translate } = useInternationalization()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const previousLocation = (location.state as { from?: Location } | null)?.from?.pathname
  const [errorAlert, setErrorAlert] = useState<LagoApiError>()

  const lagoErrorCode = searchParams.get('lago_error_code')

  const [fetchAuthorizeUrl] = useAuthorizeMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (lagoErrorCode) {
      setErrorAlert(lagoErrorCode as LagoApiError)

      // Remove the error code from the URL, so it disappears on page reload
      history.replaceState({}, '', window.location.pathname)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useAppForm({
    defaultValues: loginSSODefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: loginSSOValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const answer = await fetchAuthorizeUrl({
        variables: {
          input: {
            email: value.email,
          },
        } as TVariables,
      })

      const { errors, data } = answer

      if (hasDefinedGQLError('DomainNotConfigured', errors)) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              email: {
                message: translate(getErrorKey(LagoApiError.DomainNotConfigured)),
                path: ['email'],
              },
            },
          },
        })
        return
      }

      if (errors?.length) {
        setErrorAlert(LagoApiError.UnprocessableEntity)
        return
      }

      const authorizeUrl = getAuthorizeUrl(data)

      if (!authorizeUrl) return

      setErrorAlert(undefined)

      if (previousLocation) {
        setItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY, previousLocation)
      }

      window.location.href = addValuesToUrlState({
        url: authorizeUrl,
        stateType: 'string',
        values: {},
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={8}>
            <Stack spacing={3}>
              <Typography variant="headline">{translate(titleKey)}</Typography>
              <Typography>{translate(subtitleKey)}</Typography>
            </Stack>

            {!!errorAlert && (
              <Alert type="danger" data-test={errorAlertDataTest}>
                <Typography color="textSecondary">{translate(getErrorKey(errorAlert))}</Typography>
              </Alert>
            )}

            <form.AppField name="email">
              {(field) => (
                <field.TextInputField
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  beforeChangeFormatter={['lowercase']}
                  label={translate('text_62ab2d0396dd6b0361614d60')}
                  placeholder={translate('text_62a99ba2af7535cefacab4bf')}
                />
              )}
            </form.AppField>

            <form.AppForm>
              <form.SubmitButton dataTest="submit" fullWidth size="large">
                {translate('text_620bc4d4269a55014d493f6d')}
              </form.SubmitButton>
            </form.AppForm>

            <Typography
              className="mx-auto text-center"
              variant="caption"
              html={translate(footerKey, {
                linkLogin: LOGIN_ROUTE,
              })}
            />
          </Stack>
        </form>
      </Card>
    </Page>
  )
}
