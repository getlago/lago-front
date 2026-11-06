import { z } from 'zod'

const GOOGLE_OAUTH_FLOW_KEY = 'googleOauthFlow'

const googleOauthFlowSchema = z.object({
  stateSecret: z.string(),
  mode: z.enum(['login', 'signup', 'invite']),
  invitationToken: z.string().optional(),
  redirectPath: z.string().optional(),
})

export type GoogleOauthFlow = z.infer<typeof googleOauthFlowSchema>

export type GoogleInviteState = {
  googleState: string
  googleStateSecret: string
}

export const storeGoogleOauthFlow = (flow: GoogleOauthFlow): void => {
  try {
    sessionStorage.setItem(GOOGLE_OAUTH_FLOW_KEY, JSON.stringify(flow))
  } catch {
    // sessionStorage unavailable (blocked, sandboxed): the callback then reports a failed flow
  }
}

export const takeGoogleOauthFlow = (): GoogleOauthFlow | undefined => {
  try {
    const stored = sessionStorage.getItem(GOOGLE_OAUTH_FLOW_KEY)

    sessionStorage.removeItem(GOOGLE_OAUTH_FLOW_KEY)

    const parsed = googleOauthFlowSchema.safeParse(JSON.parse(stored ?? 'null'))

    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}
