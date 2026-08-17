export enum FeatureFlags {
  SUPERSET_PERSISTENT_FILTERS = 'superset_persistent_filters',
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
export const getEnableFeatureFlags = (): FeatureFlags[] => {
  const stored = localStorage.getItem(FF_KEY)

  if (!stored) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      throw new Error('Stored feature flags are not an array')
    }

    return parsed.filter(isKnownFeatureFlag)
  } catch {
    localStorage.removeItem(FF_KEY)

    return []
  }
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
