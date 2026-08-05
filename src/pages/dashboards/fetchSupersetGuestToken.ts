import { type ApolloClient, gql } from '@apollo/client'

export const CREATE_SUPERSET_GUEST_TOKEN = gql`
  mutation createSupersetGuestToken($input: CreateSupersetGuestTokenInput!) {
    createSupersetGuestToken(input: $input) {
      guestToken
    }
  }
`

export const createFetchSupersetGuestToken =
  (client: ApolloClient<object>, dashboardId: string) => async (): Promise<string> => {
    const { data } = await client.mutate({
      mutation: CREATE_SUPERSET_GUEST_TOKEN,
      variables: { input: { dashboardId } },
      fetchPolicy: 'no-cache',
    })

    return data?.createSupersetGuestToken?.guestToken ?? ''
  }
