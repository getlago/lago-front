import { gql } from '@apollo/client'

import { addToast } from '~/core/apolloClient'
import {
  EmailSettingsEnum,
  useGetEmailSettingsQuery,
  useUpdateEmailSettingMutation,
} from '~/generated/graphql'

gql`
  query getEmailSettings {
    organization {
      id
      emailSettings
      logoUrl
      name
    }
  }

  mutation updateEmailSetting($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      emailSettings
    }
  }
`

type UseEmailConfigReturn = () => {
  loading: boolean
  emailSettings: EmailSettingsEnum[]
  updateEmailSettings: (type: EmailSettingsEnum, value: boolean) => Promise<unknown> | void
  logoUrl?: string
  name?: string
}

export const useEmailConfig: UseEmailConfigReturn = () => {
  const { data, loading } = useGetEmailSettingsQuery()
  const emailSettings = data?.organization?.emailSettings || []
  const [updateSetting] = useUpdateEmailSettingMutation()

  return {
    loading,
    emailSettings,
    logoUrl: data?.organization?.logoUrl || undefined,
    name: data?.organization?.name || undefined,
    updateEmailSettings: async (type, value) => {
      let newSetting: EmailSettingsEnum[] = []

      if (value) {
        newSetting = [...emailSettings, type]
      } else {
        newSetting = emailSettings.filter((setting) => setting !== type)
      }

      const res = await updateSetting({
        variables: {
          input: {
            emailSettings: newSetting,
          },
        },
      })

      if (!!res?.errors) return

      if ((res?.data?.updateOrganization?.emailSettings || [])?.includes(type)) {
        addToast({
          severity: 'success',
          translateKey: 'text_6407684eaf41130074c4b2b1',
        })
      } else {
        addToast({
          severity: 'success',
          translateKey: 'text_6407684eaf41130074c4b2b0',
        })
      }
    },
  }
}
