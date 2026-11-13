import { resumePersistence } from './cachePersistor'
import { authTokenVar, setCurrentOrganizationId } from './reactiveVars'

// Forgets the organization in the same tick as the token: any earlier, the still-authenticated
// `OrganizationLayout` writes it back from the previous user's data.
export const adoptStoredSession = (token: string | undefined): void => {
  setCurrentOrganizationId(null)
  if (token) resumePersistence()
  authTokenVar(token)
}
