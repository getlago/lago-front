import { useEffect } from 'react'

import { loadRecaptcha, unloadRecaptcha } from '~/core/utils/recaptcha'

// Loaded while the page is mounted only, so reCAPTCHA never runs on the rest of the app
export const useRecaptcha = (): void => {
  useEffect(() => {
    void loadRecaptcha()

    return unloadRecaptcha
  }, [])
}

// For pages that load reCAPTCHA with their first token: it still leaves with the page
export const useRecaptchaCleanup = (): void => {
  useEffect(() => unloadRecaptcha, [])
}
