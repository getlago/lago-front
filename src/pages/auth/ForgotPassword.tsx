import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useState } from 'react'
import { object, string } from 'yup'

import { Button, ButtonLink } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { LagoApiError, useCreatePasswordResetMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

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
            <Title>{translate('text_642707b0da1753a9bb66728e')}</Title>
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
            <Title>{translate('text_642707b0da1753a9bb66728c')}</Title>
            <Subtitle>{translate('text_642707b0da1753a9bb667296')}</Subtitle>
            <form onSubmit={(e) => e.preventDefault()}>
              <TextInputField
                className="mb-8"
                name="email"
                beforeChangeFormatter={['lowercase']}
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
