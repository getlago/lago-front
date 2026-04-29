import { gql, useMutation } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { object, string } from 'yup'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { TextInputField } from '~/components/form'
import { hasDefinedGQLError, setItemFromLS } from '~/core/apolloClient'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/constants/localStorageKeys'
import { LOGIN_ROUTE } from '~/core/router'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import { LagoApiError } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { Card, Page, StyledLogo } from '~/styles/auth'

const ENTRA_ID_USERINFO_ERROR = 'entra_id_userinfo_error'

const getErrorKey = (code: string): string => {
  switch (code) {
    case ENTRA_ID_USERINFO_ERROR:
      return 'text_664c98989d08a3f733357f73'
    case LagoApiError.DomainNotConfigured:
      return 'text_664c90c9b2b6c2012aa50bd6'
    default:
      return 'text_62b31e1f6a5b8b1b745ece48'
  }
}

const LoginEntraId = () => {
  const { translate } = useInternationalization()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const previousLocation = (location.state as { from?: Location } | null)?.from?.pathname
  const [errorAlert, setErrorAlert] = useState<string>()
  const [errorField, setErrorField] = useState<string>()

  const lagoErrorCode = searchParams.get('lago_error_code')

  const [fetchEntraIdAuthorizeUrl, { error: fetchEntraIdAuthorizeUrlError, loading }] =
    useMutation<{
      entraIdAuthorize?: { url?: string }
    }>(
      gql`
        mutation fetchEntraIdAuthorizeUrl($input: EntraIdAuthorizeInput!) {
          entraIdAuthorize(input: $input) {
            url
          }
        }
      `,
      {
        context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        fetchPolicy: 'network-only',
      },
    )

  useEffect(() => {
    if (lagoErrorCode) {
      setErrorAlert(lagoErrorCode)

      // Remove the error code from the URL, so it disappears on page reload
      history.replaceState({}, '', window.location.pathname)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!fetchEntraIdAuthorizeUrlError) return

    if (hasDefinedGQLError('DomainNotConfigured', fetchEntraIdAuthorizeUrlError)) {
      setErrorField(LagoApiError.DomainNotConfigured)
      return
    }

    setErrorAlert(LagoApiError.UnprocessableEntity)
  }, [fetchEntraIdAuthorizeUrlError])

  const formikProps = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: object().shape({
      email: string()
        .email('text_620bc4d4269a55014d493fc3')
        .required('text_620bc4d4269a55014d493f98'),
    }),
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      const { data } = await fetchEntraIdAuthorizeUrl({
        variables: {
          input: {
            email: values.email,
          },
        },
      })

      if (!data?.entraIdAuthorize?.url) return

      setErrorField(undefined)
      setErrorAlert(undefined)

      if (previousLocation) {
        setItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY, previousLocation)
      }

      window.location.href = addValuesToUrlState({
        url: data.entraIdAuthorize.url,
        stateType: 'string',
        values: {},
      })
    },
  })

  useShortcuts([
    {
      keys: ['Enter'],
      action: formikProps.submitForm,
    },
  ])

  const getEmailFieldError = (): string | undefined => {
    if (formikProps.touched.email && formikProps.errors.email) {
      return formikProps.errors.email
    }

    if (errorField) {
      return translate(getErrorKey(errorField))
    }

    return undefined
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <Stack spacing={8}>
          <Stack spacing={3}>
            <Typography variant="headline">Log in with Entra ID</Typography>
            <Typography>Enter your work email to continue with Microsoft Entra ID.</Typography>
          </Stack>

          {/* This error is displayed in the input */}
          {!!errorAlert && (
            <Alert type="danger" data-test="login-entra-id-error-alert">
              <Typography color="textSecondary">{translate(getErrorKey(errorAlert))}</Typography>
            </Alert>
          )}

          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            name="email"
            beforeChangeFormatter={['lowercase']}
            formikProps={formikProps}
            label={translate('text_62ab2d0396dd6b0361614d60')}
            placeholder={translate('text_62a99ba2af7535cefacab4bf')}
            error={getEmailFieldError()}
          />

          <Button
            data-test="submit"
            fullWidth
            size="large"
            onClick={formikProps.submitForm}
            loading={formikProps.isSubmitting || loading}
          >
            {translate('text_620bc4d4269a55014d493f6d')}
          </Button>

          <Typography
            className="mx-auto text-center"
            variant="caption"
            html={translate('text_664c90c9b2b6c2012aa50bda', {
              linkLogin: LOGIN_ROUTE,
            })}
          />
        </Stack>
      </Card>
    </Page>
  )
}

export default LoginEntraId
