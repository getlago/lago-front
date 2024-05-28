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
  domain: string().domain('text_664c732c264d7eed1c74fe03').required(''),
  clientId: string().required(''),
  clientSecret: string().required(''),
  organizationName: string().required(''),
})

export interface UseOktaIntegrationProps {
  initialValues?: AddOktaIntegrationDialogFragment
  onSubmit?: (id: string) => void
}

export const useOktaIntegration = ({ initialValues, onSubmit }: UseOktaIntegrationProps) => {
  const { translate } = useInternationalization()
  const isEdition = !!initialValues

  const [createIntegration] = useCreateOktaIntegrationMutation({
    onCompleted: (res) => {
      if (!res.createOktaIntegration) return

      onSubmit?.(res.createOktaIntegration?.id)
      addToast({
        severity: 'success',
        message: translate('text_664c732c264d7eed1c74fde6', {
          integration: translate('text_664c732c264d7eed1c74fda2'),
        }),
      })
    },
  })

  const [updateIntegration] = useUpdateOktaIntegrationMutation({
    onCompleted: (res) => {
      if (!res.updateOktaIntegration) return

      onSubmit?.(res.updateOktaIntegration?.id)
      addToast({
        severity: 'success',
        message: translate('text_664c732c264d7eed1c74fde8', {
          integration: translate('text_664c732c264d7eed1c74fda2'),
        }),
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
