import { envGlobalVar } from '~/core/apolloClient'

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

type RecaptchaAction = 'signup' | 'signup_resend' | 'signup_confirm' | 'signup_google'

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'
const RECAPTCHA_TIMEOUT_MS = 10_000

let recaptchaScript: Promise<Grecaptcha | undefined> | undefined

export const loadRecaptcha = (): Promise<Grecaptcha | undefined> => {
  const { recaptchaSiteKey } = envGlobalVar()

  if (!recaptchaSiteKey) return Promise.resolve(undefined)

  if (!recaptchaScript) {
    recaptchaScript = new Promise((resolve) => {
      const script = document.createElement('script')

      script.src = `${RECAPTCHA_SCRIPT_URL}?render=${encodeURIComponent(recaptchaSiteKey)}`
      script.async = true
      script.onload = () => resolve(window.grecaptcha)
      script.onerror = () => {
        script.remove()
        recaptchaScript = undefined
        resolve(undefined)
      }
      document.head.appendChild(script)
    })
  }

  return recaptchaScript
}

const executeRecaptcha = async (action: RecaptchaAction): Promise<string | null> => {
  const grecaptcha = await loadRecaptcha()
  const { recaptchaSiteKey } = envGlobalVar()

  if (!grecaptcha || !recaptchaSiteKey) return null

  return new Promise((resolve) => {
    grecaptcha.ready(() => {
      Promise.resolve()
        .then(() => grecaptcha.execute(recaptchaSiteKey, { action }))
        .then(resolve, () => resolve(null))
    })
  })
}

// A token works once and expires after 2 minutes, so callers ask for one right before each request.
// null (no key, script blocked, Google unreachable) still reaches the API, which answers captcha_failed.
export const getRecaptchaToken = (action: RecaptchaAction): Promise<string | null> =>
  Promise.race([
    executeRecaptcha(action),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), RECAPTCHA_TIMEOUT_MS)),
  ])
