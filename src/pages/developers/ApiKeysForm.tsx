import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/Pages'
import { addToast } from '~/core/apolloClient'
import { API_KEYS_ROUTE } from '~/core/router'
import { formatDateToTZ } from '~/core/timezone'
import {
  CreateApiKeyInput,
  TimezoneEnum,
  UpdateApiKeyInput,
  useCreateApiKeyMutation,
  useGetApiKeyToEditQuery,
  useUpdateApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const STATE_KEY_ID_TO_REVEAL = 'keyIdToReveal'

gql`
  query getApiKeyToEdit($apiKeyId: ID!) {
    apiKey(id: $apiKeyId) {
      id
      name
      lastUsedAt
    }
  }

  mutation createApiKey($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      id
    }
  }

  mutation updateApiKey($input: UpdateApiKeyInput!) {
    updateApiKey(input: $input) {
      id
    }
  }
`

const ApiKeysForm = () => {
  const navigate = useNavigate()
  const { apiKeyId = '' } = useParams()
  const { translate } = useInternationalization()

  const { data: apiKeyData, loading: apiKeyLoading } = useGetApiKeyToEditQuery({
    variables: {
      apiKeyId,
    },
    skip: !apiKeyId,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const [createApiKey] = useCreateApiKeyMutation({
    onCompleted({ createApiKey: createApiKeyResult }) {
      if (!!createApiKeyResult?.id) {
        navigate(API_KEYS_ROUTE, {
          state: { [STATE_KEY_ID_TO_REVEAL]: createApiKeyResult.id },
        })
        addToast({
          severity: 'success',
          message: translate('text_1732286530467by9ycbpck9t'),
        })
      }
    },
  })
  const [updadeApiKey] = useUpdateApiKeyMutation({
    onCompleted({ updateApiKey: updateApiKeyResult }) {
      if (!!updateApiKeyResult?.id) {
        navigate(API_KEYS_ROUTE, {
          state: { [STATE_KEY_ID_TO_REVEAL]: updateApiKeyResult.id },
        })
        addToast({
          severity: 'success',
          message: translate('text_1732286530467pfkppwoswwt'),
        })
      }
    },
  })

  const isEdition = !!apiKeyId
  const apiKey = apiKeyData?.apiKey

  const formikProps = useFormik<Omit<CreateApiKeyInput | UpdateApiKeyInput, 'id'>>({
    initialValues: {
      name: apiKey?.name || '',
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (isEdition) {
        await updadeApiKey({
          variables: {
            input: {
              id: apiKeyId,
              ...values,
            },
          },
        })
      } else {
        await createApiKey({
          variables: {
            input: values,
          },
        })
      }
    },
  })

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        {apiKeyLoading ? (
          <Skeleton className="w-50" variant="text" />
        ) : (
          <>
            <Typography variant="bodyHl" color="grey700" noWrap>
              {translate(
                isEdition ? 'text_1732286530467umtldbwri1j' : 'text_17322865304672acg4wvc0s0',
              )}
            </Typography>
            <Button variant="quaternary" icon="close" onClick={() => navigate(API_KEYS_ROUTE)} />
          </>
        )}
      </CenteredPage.Header>

      <CenteredPage.Container>
        {apiKeyLoading ? (
          <>
            <div className="flex flex-col gap-1">
              <Skeleton className="w-40" variant="text" textVariant="headline" />
              <Skeleton className="w-100" variant="text" />
            </div>
            {[0, 1].map((_, index) => (
              <div key={`loading-block-${index}`} className="flex flex-col gap-1 pb-12 shadow-b">
                <Skeleton className="w-40" variant="text" />
                <Skeleton className="w-100" variant="text" />
                <Skeleton className="w-74" variant="text" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="grey700">
                {translate(
                  isEdition ? 'text_1732286530467umtldbwri1j' : 'text_1732286530467r7oj4moo3al',
                )}
              </Typography>
              <Typography variant="body" color="grey600">
                {translate('text_1732286530467bpqi7grn0vk')}
              </Typography>
            </div>

            {isEdition && !!apiKey?.lastUsedAt && (
              <Alert type="info">
                <Typography variant="body" color="grey700">
                  {translate('text_1732286530467pwhhpj0aczl', {
                    date: formatDateToTZ(apiKey?.lastUsedAt, TimezoneEnum.TzUtc, 'LLL. dd, yyyy'),
                  })}
                </Typography>
              </Alert>
            )}

            <div className="flex flex-col gap-6 pb-12">
              <div className="flex flex-col gap-2">
                <Typography variant="subhead" color="grey700">
                  {translate('text_1732286530467tbfarkui5o8')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_17322865304675hom00lcbyt')}
                </Typography>
              </div>

              <TextInputField
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                name="name"
                label={translate('text_1732286530467zstzwbegfiq')}
                placeholder={translate('text_17322865304681s5r90ntpdv')}
                formikProps={formikProps}
              />
            </div>
          </>
        )}
      </CenteredPage.Container>

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" onClick={() => navigate(API_KEYS_ROUTE)}>
          {translate('text_6411e6b530cb47007488b027')}
        </Button>
        <Button
          variant="primary"
          onClick={formikProps.submitForm}
          disabled={!formikProps.isValid || (isEdition && !formikProps.dirty) || apiKeyLoading}
        >
          {translate(isEdition ? 'text_17295436903260tlyb1gp1i7' : 'text_1732522865354i0r12i6z9mu')}
        </Button>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default ApiKeysForm
