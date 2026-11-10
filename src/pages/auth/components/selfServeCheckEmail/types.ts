export type CheckEmailScreen = 'waiting' | 'expired' | 'loginRequired'

export type ApplyResendState = (seconds: number | null | undefined, limitReached: boolean) => void
