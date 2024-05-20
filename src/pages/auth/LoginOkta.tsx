import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { LagoApiError, useFetchOktaAuthorizeUrlMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { Card, Page, StyledLogo } from '~/styles/auth'

const getErrorKey = (errorCode: LagoApiError): string => {
  switch (errorCode) {
    case LagoApiError.OktaUserinfoError:
      return 'TODO: There was an error while fetching user info from Okta. Please try again.'
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
  let [searchParams] = useSearchParams()
  const [errorCode, setErrorCode] = useState<LagoApiError>()

  const lagoErrorCode = searchParams.get('lago_error_code')

  const [fetchOktaAuthorizeUrl] = useFetchOktaAuthorizeUrlMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (lagoErrorCode) {
      // Set the error code to be displayed
      setErrorCode(lagoErrorCode as LagoApiError)
      // Remove the error code from the URL, so it disappears on page reload
      history.replaceState({}, '', window.location.pathname)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const { data, errors } = await fetchOktaAuthorizeUrl({
        variables: {
          input: {
            email: values.email,
          },
        },
      })

      if (hasDefinedGQLError('DomainNotConfigured', errors)) {
        setErrorCode(LagoApiError.DomainNotConfigured)
      }

      if (data?.oktaAuthorize?.url) {
        setErrorCode(undefined)
        window.location.href = data.oktaAuthorize.url
      }
    },
  })

  useShortcuts([
    {
      keys: ['Enter'],
      action: formikProps.submitForm,
    },
  ])

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <Stack spacing={8}>
          <Stack spacing={3}>
            <Typography variant="headline">{translate('TODO: Log In with Okta')}</Typography>
            <Typography>{translate('TODO: Please log in with your enterprise account')}</Typography>
          </Stack>

          {!!errorCode && (
            <Alert type="danger">
              <Typography color="textSecondary">{translate(getErrorKey(errorCode))}</Typography>
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
            error={
              formikProps.touched.email && formikProps.errors.email
                ? formikProps.errors.email
                : errorCode === LagoApiError.DomainNotConfigured
                  ? translate(
                      'TODO: Okta provider was not assigned for this domain, please contact an admin.',
                    )
                  : undefined
            }
          />

          <Button data-test="submit" fullWidth size="large" onClick={formikProps.submitForm}>
            {translate('text_620bc4d4269a55014d493f6d')}
          </Button>

          <UsefulLink
            variant="caption"
            html={translate('TODO: Log In with another method? Log In', {
              linkSignUp: LOGIN_ROUTE,
            })}
          />
        </Stack>
      </Card>
    </Page>
  )
}

export default LoginOkta

const UsefulLink = styled(Typography)`
  margin-left: auto;
  margin-right: auto;
  text-align: center;
`
