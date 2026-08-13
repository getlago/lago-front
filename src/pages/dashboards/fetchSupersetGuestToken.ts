import { type ApolloClient, gql } from '@apollo/client'

export const CREATE_SUPERSET_GUEST_TOKEN = gql`
  mutation createSupersetGuestToken($input: CreateSupersetGuestTokenInput!) {
    createSupersetGuestToken(input: $input) {
      guestToken
    }
  }
`

export type FetchSupersetGuestToken = (() => Promise<string>) & { cancel: () => void }

const haltRefreshLoop = (): Promise<string> => new Promise<string>(() => {})

export const createFetchSupersetGuestToken = (
  client: ApolloClient<object>,
  dashboardId: string,
  initialToken = '',
): FetchSupersetGuestToken => {
  let lastToken = initialToken
  let cancelled = false

  const fetchGuestToken = async (): Promise<string> => {
    if (cancelled) {
      return haltRefreshLoop()
    }

    try {
      const { data } = await client.mutate({
        mutation: CREATE_SUPERSET_GUEST_TOKEN,
        variables: { input: { dashboardId } },
        fetchPolicy: 'no-cache',
      })

      lastToken = data?.createSupersetGuestToken?.guestToken ?? lastToken

      return cancelled ? haltRefreshLoop() : lastToken
    } catch {
      return cancelled ? haltRefreshLoop() : lastToken
    }
  }

  return Object.assign(fetchGuestToken, {
    cancel: () => {
      cancelled = true
    },
  })
}
