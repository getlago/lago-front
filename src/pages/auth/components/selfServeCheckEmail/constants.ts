import { LagoApiError } from '~/generated/graphql'

export const POLL_INTERVAL_MS = 5_000
// lago-api `signup_status_per_ip`: 60 status checks a minute per network, shared by everyone behind it
export const RATE_LIMITED_POLL_INTERVAL_MS = 60_000

export const RESEND_GENERIC_ERROR = 'text_1793898059309m0mmb7g8tw4'

export const RESEND_BANNER_ERRORS: Record<string, string> = {
  [LagoApiError.SelfServeDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.SignupDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.TooManyRequests]: 'text_1793898059309ltbe60gt6pd',
  [LagoApiError.CaptchaFailed]: 'text_1793903925179h1k5w55ih95',
  [LagoApiError.LockAcquisitionFailed]: RESEND_GENERIC_ERROR,
}
