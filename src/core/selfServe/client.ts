import { AUTH_TOKEN_LS_KEY } from '~/core/apolloClient/reactiveVars'
import { getItemFromLS } from '~/core/utils/localStorage'

const SELF_SERVE_TIMEOUT_MS = 15_000

export class SelfServeApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly errorDetails: unknown

  constructor({
    serviceName,
    status,
    code,
    errorDetails,
  }: {
    serviceName: string
    status: number
    code: string | null
    errorDetails: unknown
  }) {
    super(`${serviceName} answered ${status}`)
    this.name = 'SelfServeApiError'
    this.status = status
    this.code = code
    this.errorDetails = errorDetails
  }
}

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const buildApiError = async (
  serviceName: string,
  response: Response,
): Promise<SelfServeApiError> => {
  const body = await readJson(response)
  const code =
    typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
      ? body.code
      : null
  const errorDetails =
    typeof body === 'object' && body !== null && 'error_details' in body ? body.error_details : null

  return new SelfServeApiError({ serviceName, status: response.status, code, errorDetails })
}

export const postToSelfServe = async (
  service: { name: string; baseUrl: string },
  path: string,
  body?: unknown,
): Promise<unknown> => {
  if (!service.baseUrl) throw new Error(`${service.name} URL is not configured`)

  const token = getItemFromLS(AUTH_TOKEN_LS_KEY)
  const response = await fetch(`${service.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(SELF_SERVE_TIMEOUT_MS),
  })

  if (!response.ok) throw await buildApiError(service.name, response)

  return response.json()
}
