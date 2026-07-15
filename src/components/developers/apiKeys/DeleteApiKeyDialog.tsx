import { gql, useApolloClient } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { intlFormatDateTime } from '~/core/timezone/utils'
import {
  ApiKeyForDeleteApiKeyDialogFragment,
  GetApiKeysDocument,
  TimezoneEnum,
  useDestroyApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ApiKeyForDeleteApiKeyDialog on SanitizedApiKey {
    id
    lastUsedAt
  }

  mutation destroyApiKey($input: DestroyApiKeyInput!) {
    destroyApiKey(input: $input) {
      id
    }
  }
`

type DeleteApiKeyDialogProps = {
  apiKey: ApiKeyForDeleteApiKeyDialogFragment
}

export const useDeleteApiKeyDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [destroyApiKey] = useDestroyApiKeyMutation()

  const openDeleteApiKeyDialog = ({ apiKey }: DeleteApiKeyDialogProps) => {
    centralizedDialog.open({
      title: translate('text_1732182455718y0m5fijuray'),
      description: translate('text_1732182455718jvfke15s5qj'),
      colorVariant: 'danger',
      actionText: translate('text_1732182455718y0m5fijuray'),
      children: (
        <div className="mb-8 flex flex-col gap-8">
          <div className="flex w-full items-center">
            <Typography className="w-35" variant="caption" color="grey600">
              {translate('text_1731515447290xbe4iqm5n6r')}
            </Typography>
            <Typography className="flex-1" variant="body" color="grey700">
              {!!apiKey?.lastUsedAt
                ? intlFormatDateTime(apiKey?.lastUsedAt, {
                    timezone: TimezoneEnum.TzUtc,
                  }).date
                : '-'}
            </Typography>
          </div>
        </div>
      ),
      onAction: async () => {
        const result = await destroyApiKey({
          variables: { input: { id: apiKey?.id as string } },
        })

        const destroyedId = result.data?.destroyApiKey?.id

        if (destroyedId) {
          evictFromCache(client, {
            id: destroyedId,
            __typename: 'SanitizedApiKey',
            listFieldName: 'apiKeys',
            listQueryDocument: GetApiKeysDocument,
          })

          addToast({
            message: translate('text_17325256621362d6ocmq1lhw'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteApiKeyDialog }
}
