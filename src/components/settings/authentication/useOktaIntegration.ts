import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { object, string } from 'yup'

import { addToast } from '~/core/apolloClient'
import {
  AddOktaIntegrationDialogFragment,
  CreateOktaIntegrationInput,
  DeleteOktaIntegrationDialogFragmentDoc,
  useCreateOktaIntegrationMutation,
  useUpdateOktaIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const DOMAIN_REGEX: RegExp =
  /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/

gql`
  fragment AddOktaIntegrationDialog on OktaIntegration {
    id
    domain
    clientId
    clientSecret
    organizationName
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

const oktaIntegrationSchema = object().shape({
  domain: string()
    .matches(DOMAIN_REGEX, 'TODO: Please fill this input with a domain format to move forward')
    .required(''),
  clientId: string().required(''),
  clientSecret: string().required(''),
  organizationName: string().required(''),
})

interface UseOktaIntegrationProps {
  initialValues?: AddOktaIntegrationDialogFragment
  onSubmit?: (response: unknown) => void
}

export const useOktaIntegration = ({ initialValues, onSubmit }: UseOktaIntegrationProps) => {
  const { translate } = useInternationalization()
  const isEdition = !!initialValues

  const [createIntegration] = useCreateOktaIntegrationMutation({
    onCompleted: (res) => {
      onSubmit?.(res.createOktaIntegration)
      addToast({
        severity: 'success',
        message: translate('TODO: Okta integration successfully connected'),
      })
    },
  })

  const [updateIntegration] = useUpdateOktaIntegrationMutation({
    onCompleted: (res) => {
      onSubmit?.(res.updateOktaIntegration)
      addToast({
        severity: 'success',
        message: translate('TODO: Okta integration successfully edited'),
      })
    },
  })

  const formikProps = useFormik<CreateOktaIntegrationInput>({
    initialValues: {
      domain: initialValues?.domain || '',
      clientId: initialValues?.clientId || '',
      clientSecret: initialValues?.clientSecret || '',
      organizationName: initialValues?.organizationName || '',
    },
    validationSchema: oktaIntegrationSchema,
    onSubmit: async (values) => {
      if (isEdition) {
        await updateIntegration({
          variables: {
            input: {
              ...values,
              id: initialValues?.id || '',
            },
          },
        })
      } else {
        await createIntegration({ variables: { input: values } })
      }
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  return {
    formikProps,
  }
}
