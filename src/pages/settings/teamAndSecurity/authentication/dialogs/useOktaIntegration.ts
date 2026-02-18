import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { z } from 'zod'

import { addToast } from '~/core/apolloClient'
import { zodDomain, zodHost } from '~/formValidation/zodCustoms'
import {
  AddOktaIntegrationDialogFragment,
  CreateOktaIntegrationInput,
  DeleteOktaIntegrationDialogFragmentDoc,
  useCreateOktaIntegrationMutation,
  useUpdateOktaIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddOktaIntegrationDialog on OktaIntegration {
    id
    domain
    clientId
    clientSecret
    organizationName
    host
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

  const defaultValues: CreateOktaIntegrationInput = {
    domain: initialValues?.domain || '',
    host: initialValues?.host || '',
    clientId: initialValues?.clientId || '',
    clientSecret: initialValues?.clientSecret || '',
    organizationName: initialValues?.organizationName || '',
  }

  const validationSchema = z.object({
    domain: zodDomain,
    host: zodHost.optional(),
    clientId: z.string(),
    clientSecret: z.string(),
    organizationName: z.string(),
  })

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      if (isEdition) {
        await updateIntegration({
          variables: {
            input: {
              ...value,
              id: initialValues?.id || '',
            },
          },
        })
      } else {
        await createIntegration({ variables: { input: value } })
      }
    },
  })

  return {
    form,
  }
}
