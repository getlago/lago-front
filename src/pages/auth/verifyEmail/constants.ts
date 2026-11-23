import { LagoApiError, SignupVerificationStatusEnum } from '~/generated/graphql'

import { ClosedLinkState, LinkState } from './types'

export const STATUS_STATES: Record<SignupVerificationStatusEnum, LinkState> = {
  [SignupVerificationStatusEnum.Valid]: 'valid',
  [SignupVerificationStatusEnum.Expired]: 'expired',
  [SignupVerificationStatusEnum.Replaced]: 'replaced',
  [SignupVerificationStatusEnum.Locked]: 'locked',
  [SignupVerificationStatusEnum.AlreadyVerified]: 'alreadyVerified',
  [SignupVerificationStatusEnum.Invalid]: 'invalid',
}

export const ERROR_STATES: Partial<Record<string, LinkState>> = {
  [LagoApiError.SignupTokenExpired]: 'expired',
  [LagoApiError.SignupTokenReplaced]: 'replaced',
  [LagoApiError.SignupTokenLocked]: 'locked',
  [LagoApiError.EmailAlreadyVerified]: 'alreadyVerified',
  [LagoApiError.NotFound]: 'invalid',
}

export const STATE_COPY: Record<ClosedLinkState, { title: string; text?: string }> = {
  expired: { title: 'text_17939098854938mhkhcmdqx6', text: 'text_1793909885493brc9lgngttd' },
  replaced: { title: 'text_1793909885493qtdzedxgk6p', text: 'text_1793909885493k55xbrj851s' },
  locked: { title: 'text_1793909885493yg0ux3qj2bt' },
  alreadyVerified: {
    title: 'text_17939098854938x57tjzp3qz',
    text: 'text_1793909885493y1x2g94qrvg',
  },
  invalid: { title: 'text_1793909885493kffsxynepp2', text: 'text_17939098854935wfebtg04x2' },
  signupExpired: { title: 'text_1793906497618doa3hbp1lmh' },
}
