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

type RecaptchaAction = 'signup'

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'
const RECAPTCHA_LOAD_TIMEOUT_MS = 5_000
const RECAPTCHA_TIMEOUT_MS = 10_000

type RecaptchaLoad = { promise: Promise<Grecaptcha | undefined>; cancel: () => void }

let currentLoad: RecaptchaLoad | undefined

// Removes api.js, the library it pulls from gstatic (its path also holds /recaptcha/) and the badge
const removeRecaptchaFromPage = (): void => {
  document.querySelectorAll('script[src*="/recaptcha/"]').forEach((script) => script.remove())
  document.querySelectorAll('.grecaptcha-badge').forEach((badge) => badge.remove())
  delete window.grecaptcha
  delete window.___grecaptcha_cfg
}

const injectRecaptcha = (siteKey: string): RecaptchaLoad => {
  let isCancelled = false

  const promise = new Promise<Grecaptcha | undefined>((resolve) => {
    const script = document.createElement('script')

    const settle = (grecaptcha?: Grecaptcha): void => {
      clearTimeout(timer)
      resolve(grecaptcha)
    }

    // A blocker can serve api.js and stop the library it loads, then ready() never calls back
    const timer = setTimeout(() => {
      isCancelled = true
      settle(undefined)
    }, RECAPTCHA_LOAD_TIMEOUT_MS)

    script.src = `${RECAPTCHA_SCRIPT_URL}?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.onerror = () => settle(undefined)
    script.onload = () => {
      const { grecaptcha } = window

      if (!grecaptcha) return settle(undefined)

      grecaptcha.ready(() => {
        if (!isCancelled) return settle(grecaptcha)

        // Removing the tag does not stop a fetched api.js: a cancelled load that still arrives
        // cleans up after itself, unless a newer load owns the page by now
        if (!currentLoad) removeRecaptchaFromPage()
      })
    }
    document.head.appendChild(script)
  })

  return {
    promise,
    cancel: () => {
      isCancelled = true
    },
  }
}

export const unloadRecaptcha = (): void => {
  currentLoad?.cancel()
  currentLoad = undefined
  removeRecaptchaFromPage()
}

export const loadRecaptcha = (): Promise<Grecaptcha | undefined> => {
  const { recaptchaSiteKey } = envGlobalVar()

  if (!recaptchaSiteKey) return Promise.resolve(undefined)

  if (!currentLoad) {
    const load = injectRecaptcha(recaptchaSiteKey)

    currentLoad = load
    // A failed load is cleaned up so the next call tries again, unless a newer load replaced it
    void load.promise.then((grecaptcha) => {
      if (!grecaptcha && currentLoad === load) unloadRecaptcha()
    })
  }

  return currentLoad.promise
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
