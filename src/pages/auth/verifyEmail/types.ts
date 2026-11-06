export type LinkState =
  'valid' | 'expired' | 'replaced' | 'locked' | 'alreadyVerified' | 'invalid' | 'signupExpired'

export type ClosedLinkState = Exclude<LinkState, 'valid'>

export type ResendNotice =
  { type: 'sent' } | { type: 'tooSoon'; seconds: number } | { type: 'limitReached' }
