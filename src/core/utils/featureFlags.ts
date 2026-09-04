export enum FeatureFlags {
  REVENUE_RECOGNITION = 'revenue_recognition',
}

const FF_KEY = 'featureFlags'

export const listFeatureFlags = (): FeatureFlags[] => {
  return Object.values(FeatureFlags)
}

const isKnownFeatureFlag = (value: unknown): value is FeatureFlags => {
  return listFeatureFlags().includes(value as FeatureFlags)
}

/**
 * The stored value is hand-editable in devtools, so it cannot be trusted:
 * anything that is not a JSON array of declared flags is discarded and the key
 * is cleared. Without this, a malformed value threw from the render of the main
 * nav and locked the whole app on the error fallback, which a refresh could not
 * recover from (Sentry FRONT-17H).
 */
const discardStoredFeatureFlags = (): FeatureFlags[] => {
  localStorage.removeItem(FF_KEY)

  return []
}

export const getEnableFeatureFlags = (): FeatureFlags[] => {
  const stored = localStorage.getItem(FF_KEY)

  if (!stored) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(stored)
  } catch {
    return discardStoredFeatureFlags()
  }

  if (!Array.isArray(parsed)) {
    return discardStoredFeatureFlags()
  }

  return parsed.filter(isKnownFeatureFlag)
}

export const isFeatureFlagActive = (flag: FeatureFlags): boolean => {
  const flags = getEnableFeatureFlags()

  return flags.includes(flag)
}

const resolveFeatureFlags = (flags: FeatureFlags[] | FeatureFlags | 'all'): FeatureFlags[] => {
  if (!flags) {
    return []
  }

  if (flags === 'all') {
    return listFeatureFlags()
  }

  if (!Array.isArray(flags)) {
    return [flags]
  }

  return flags
}

export const setFeatureFlags = (flags: FeatureFlags[] | FeatureFlags | 'all'): FeatureFlags[] => {
  const known = resolveFeatureFlags(flags).filter(isKnownFeatureFlag)

  localStorage.setItem(FF_KEY, JSON.stringify(known))

  return getEnableFeatureFlags()
}
