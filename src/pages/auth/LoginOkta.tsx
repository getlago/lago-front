import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { object, string } from 'yup'

import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import { LagoApiError, useFetchOktaAuthorizeUrlMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { Card, Page, StyledLogo } from '~/styles/auth'

const getErrorKey = (code: LagoApiError): string => {
  switch (code) {
    case LagoApiError.OktaUserinfoError:
      return 'text_664c98989d08a3f733357f73'
    case LagoApiError.DomainNotConfigured:
      return 'text_664c90c9b2b6c2012aa50bd6'
    default:
      return 'text_62b31e1f6a5b8b1b745ece48'
  }
}

gql`
  mutation fetchOktaAuthorizeUrl($input: OktaAuthorizeInput!) {
    oktaAuthorize(input: $input) {
      url
    }
  }
`

const LoginOkta = () => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const [errorAlert, setErrorAlert] = useState<LagoApiError>()
  const [errorField, setErrorField] = useState<LagoApiError>()

  const lagoErrorCode = searchParams.get('lago_error_code')

  const [fetchOktaAuthorizeUrl, { error: fetchOktaAuthorizeUrlError, loading }] =
    useFetchOktaAuthorizeUrlMutation({
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

  useEffect(() => {
    if (fetchOktaAuthorizeUrlError) {
      if (hasDefinedGQLError('DomainNotConfigured', fetchOktaAuthorizeUrlError)) {
        setErrorField(LagoApiError.DomainNotConfigured)
      } else {
        setErrorAlert(LagoApiError.UnprocessableEntity)
      }
    }
  }, [fetchOktaAuthorizeUrlError])

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
      const { data } = await fetchOktaAuthorizeUrl({
        variables: {
          input: {
            email: values.email,
          },
        },
      })

      if (data?.oktaAuthorize?.url) {
        setErrorField(undefined)
        setErrorAlert(undefined)
        window.location.href = addValuesToUrlState({
          url: data.oktaAuthorize.url,
          stateType: 'string',
          values: {},
        })
      }
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
            <Typography variant="headline">{translate('text_664c90c9b2b6c2012aa50bce')}</Typography>
            <Typography>{translate('text_664c90c9b2b6c2012aa50bd0')}</Typography>
          </Stack>

          {/* This error is displayed in the input */}
          {!!errorAlert && (
            <Alert type="danger" data-test="login-okta-error-alert">
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

export default LoginOkta
