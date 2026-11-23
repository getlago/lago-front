import { LagoApiError } from '~/generated/graphql'

export const SIGNUP_GENERIC_ERROR = 'text_1793898059309m0mmb7g8tw4'

const SIGNUP_BANNER_ERRORS: Record<string, string> = {
  [LagoApiError.SelfServeDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.SignupDisabled]: 'text_1793898059309an560s3nkan',
  [LagoApiError.TooManyRequests]: 'text_1793898059309ltbe60gt6pd',
  [LagoApiError.CaptchaFailed]: 'text_1793903925179h1k5w55ih95',
  [LagoApiError.LockAcquisitionFailed]: SIGNUP_GENERIC_ERROR,
}

export const getSignupBannerError = (code: string): string =>
  SIGNUP_BANNER_ERRORS[code] || SIGNUP_GENERIC_ERROR
