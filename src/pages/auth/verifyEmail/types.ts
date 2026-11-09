export type LinkState =
  'valid' | 'expired' | 'replaced' | 'locked' | 'alreadyVerified' | 'invalid' | 'signupExpired'

export type ClosedLinkState = Exclude<LinkState, 'valid'>

export type ResendNotice =
  { type: 'sent'; canSendMore: boolean } | { type: 'tooSoon' } | { type: 'limitReached' }
