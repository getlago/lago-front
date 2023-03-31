import { useState } from 'react'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Button, ButtonLink } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { LOGIN_ROUTE } from '~/core/router'
import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { TextInputField } from '~/components/form'
import { theme } from '~/styles'
import { LagoApiError, useCreatePasswordResetMutation } from '~/generated/graphql'
import { hasDefinedGQLError } from '~/core/apolloClient'

gql`
  mutation createPasswordReset($input: CreatePasswordResetInput!) {
    createPasswordReset(input: $input) {
      id
    }
  }
`

const ForgotPassword = () => {
  const { translate } = useInternationalization()
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [createPasswordReset] = useCreatePasswordResetMutation({
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    onCompleted(data) {
      if (data && data.createPasswordReset) {
        setHasSubmitted(true)
      }
    },
  })

  const formikProps = useFormik<{ email: string }>({
    initialValues: {
      email: '',
    },
    validationSchema: object().shape({
      email: string()
        .email('text_620bc4d4269a55014d493fc3')
        .required('text_620bc4d4269a55014d493f98'),
    }),
    onSubmit: async (values, formikBag) => {
      const answer = await createPasswordReset({
        variables: {
          input: {
            email: values.email,
          },
        },
      })

      const { errors } = answer

      if (hasDefinedGQLError('NotFound', errors)) {
        formikBag.setFieldError('email', translate('text_642707b0da1753a9bb6672ac'))
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
        {hasSubmitted ? (
          <>
            <Title variant="headline">{translate('text_642707b0da1753a9bb66728e')}</Title>
            <Subtitle>{translate('text_642707b0da1753a9bb667298')}</Subtitle>
            <ButtonLink
              type="button"
              to={LOGIN_ROUTE}
              buttonProps={{ size: 'large', fullWidth: true, variant: 'secondary' }}
            >
              {translate('text_642707b0da1753a9bb6672a1')}
            </ButtonLink>
          </>
        ) : (
          <>
            <Title variant="headline">{translate('text_642707b0da1753a9bb66728c')}</Title>
            <Subtitle>{translate('text_642707b0da1753a9bb667296')}</Subtitle>
            <form onSubmit={(e) => e.preventDefault()}>
              <EmailInput
                name="email"
                formikProps={formikProps}
                label={translate('text_62a99ba2af7535cefacab4aa')}
                placeholder={translate('text_62a99ba2af7535cefacab4bf')}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />

              <Button
                size="large"
                disabled={!formikProps.isValid || !formikProps.dirty}
                onClick={formikProps.submitForm}
                fullWidth
              >
                {translate('text_642707b0da1753a9bb6672b2')}
              </Button>
            </form>
          </>
        )}
      </Card>
    </Page>
  )
}

export default ForgotPassword

const EmailInput = styled(TextInputField)`
  margin-bottom: ${theme.spacing(8)};
`
