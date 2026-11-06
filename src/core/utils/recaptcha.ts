import { envGlobalVar } from '~/core/apolloClient'

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
    ___grecaptcha_cfg?: unknown
  }
}

type RecaptchaAction = 'signup' | 'signup_resend' | 'signup_confirm' | 'signup_google'

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'
const RECAPTCHA_LOAD_TIMEOUT_MS = 5_000
const RECAPTCHA_TIMEOUT_MS = 10_000

let recaptchaScript: Promise<Grecaptcha | undefined> | undefined

const injectRecaptcha = (siteKey: string): Promise<Grecaptcha | undefined> =>
  new Promise((resolve) => {
    const script = document.createElement('script')

    const settle = (grecaptcha?: Grecaptcha): void => {
      clearTimeout(timer)
      resolve(grecaptcha)
    }

    // A blocker can serve api.js and stop the library it loads, then ready() never calls back
    const timer = setTimeout(() => settle(undefined), RECAPTCHA_LOAD_TIMEOUT_MS)

    script.src = `${RECAPTCHA_SCRIPT_URL}?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.onerror = () => settle(undefined)
    script.onload = () => {
      const { grecaptcha } = window

      if (!grecaptcha) return settle(undefined)

      grecaptcha.ready(() => settle(grecaptcha))
    }
    document.head.appendChild(script)
  })

// Removes api.js, the library it pulls from gstatic (its path also holds /recaptcha/) and the badge
export const unloadRecaptcha = (): void => {
  recaptchaScript = undefined
  document.querySelectorAll('script[src*="/recaptcha/"]').forEach((script) => script.remove())
  document.querySelectorAll('.grecaptcha-badge').forEach((badge) => badge.remove())
  delete window.grecaptcha
  delete window.___grecaptcha_cfg
}

export const loadRecaptcha = (): Promise<Grecaptcha | undefined> => {
  const { recaptchaSiteKey } = envGlobalVar()

  if (!recaptchaSiteKey) return Promise.resolve(undefined)

  if (!recaptchaScript) {
    const loading = injectRecaptcha(recaptchaSiteKey)

    recaptchaScript = loading
    // A failed load is cleaned up so the next call tries again, unless a newer load replaced it
    void loading.then((grecaptcha) => {
      if (!grecaptcha && recaptchaScript === loading) unloadRecaptcha()
    })
  }

  return recaptchaScript
}

const executeRecaptcha = async (action: RecaptchaAction): Promise<string | null> => {
  const grecaptcha = await loadRecaptcha()
  const { recaptchaSiteKey } = envGlobalVar()

  if (!grecaptcha || !recaptchaSiteKey) return null

  try {
    return await grecaptcha.execute(recaptchaSiteKey, { action })
  } catch {
    return null
  }
}

// A token works once and expires after 2 minutes, so callers ask for one right before each request.
// null (no key, script blocked, Google unreachable) still reaches the API, which answers captcha_failed.
export const getRecaptchaToken = (action: RecaptchaAction): Promise<string | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), RECAPTCHA_TIMEOUT_MS)
  })

  return Promise.race([executeRecaptcha(action), timeout]).finally(() => clearTimeout(timer))
}
