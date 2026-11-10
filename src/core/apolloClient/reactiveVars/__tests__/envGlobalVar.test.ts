type EnvGlobal = ReturnType<(typeof import('../envGlobalVar'))['envGlobalVar']>
type SignUpEnvKey =
  | 'LAGO_SELF_SERVE_ENABLED'
  | 'LAGO_DISABLE_SIGNUP'
  | 'LAGO_US_FRONT_URL'
  | 'LAGO_EU_FRONT_URL'
  | 'LAGO_RECAPTCHA_SITE_KEY'

const ORIGINAL_SIGN_UP_ENV: Record<SignUpEnvKey, string> = {
  LAGO_SELF_SERVE_ENABLED: window.LAGO_SELF_SERVE_ENABLED,
  LAGO_DISABLE_SIGNUP: window.LAGO_DISABLE_SIGNUP,
  LAGO_US_FRONT_URL: window.LAGO_US_FRONT_URL,
  LAGO_EU_FRONT_URL: window.LAGO_EU_FRONT_URL,
  LAGO_RECAPTCHA_SITE_KEY: window.LAGO_RECAPTCHA_SITE_KEY,
}

const setEnvValue = (key: SignUpEnvKey, value: string | undefined): void => {
  Object.assign(window, { [key]: value })
}

const loadEnvGlobal = async (): Promise<EnvGlobal> => {
  const { envGlobalVar } = await import('../envGlobalVar')

  return envGlobalVar()
}

describe('envGlobalVar', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    Object.assign(window, ORIGINAL_SIGN_UP_ENV)
  })

  describe('GIVEN LAGO_SELF_SERVE_ENABLED is set', () => {
    describe('WHEN the trimmed, lowercased value is true', () => {
      it.each([['true'], [' TRUE '], ['True'], ['\ttrue\n']])(
        'THEN should enable self-serve for %p',
        async (value) => {
          setEnvValue('LAGO_SELF_SERVE_ENABLED', value)

          const { selfServeEnabled } = await loadEnvGlobal()

          expect(selfServeEnabled).toBe(true)
        },
      )
    })

    describe('WHEN the value is anything other than true', () => {
      it.each([[''], ['   '], ['false'], ['1'], ['yes'], ['on'], ['truee']])(
        'THEN should disable self-serve for %p',
        async (value) => {
          setEnvValue('LAGO_SELF_SERVE_ENABLED', value)

          const { selfServeEnabled } = await loadEnvGlobal()

          expect(selfServeEnabled).toBe(false)
        },
      )
    })
  })

  describe('GIVEN LAGO_SELF_SERVE_ENABLED is unset', () => {
    describe('WHEN the env is loaded', () => {
      it('THEN should disable self-serve', async () => {
        setEnvValue('LAGO_SELF_SERVE_ENABLED', undefined)

        const { selfServeEnabled } = await loadEnvGlobal()

        expect(selfServeEnabled).toBe(false)
      })
    })
  })

  describe('GIVEN LAGO_DISABLE_SIGNUP is set', () => {
    describe('WHEN the value is exactly true', () => {
      it('THEN should disable the sign-up', async () => {
        setEnvValue('LAGO_DISABLE_SIGNUP', 'true')

        const { disableSignUp } = await loadEnvGlobal()

        expect(disableSignUp).toBe(true)
      })
    })

    describe('WHEN the value only matches true once trimmed or lowercased', () => {
      it.each([[' TRUE '], ['True'], [' true']])(
        'THEN should keep the sign-up enabled for %p',
        async (value) => {
          setEnvValue('LAGO_DISABLE_SIGNUP', value)

          const { disableSignUp } = await loadEnvGlobal()

          expect(disableSignUp).toBe(false)
        },
      )
    })

    describe('WHEN the value is false, empty or unset', () => {
      it.each([['false'], [''], [undefined]])(
        'THEN should keep the sign-up enabled for %p',
        async (value) => {
          setEnvValue('LAGO_DISABLE_SIGNUP', value)

          const { disableSignUp } = await loadEnvGlobal()

          expect(disableSignUp).toBe(false)
        },
      )
    })
  })

  describe('GIVEN both sign-up flags are set', () => {
    describe('WHEN they hold different values', () => {
      it.each([
        {
          selfServe: 'true',
          disableSignUp: 'false',
          selfServeEnabled: true,
          signUpDisabled: false,
        },
        {
          selfServe: 'false',
          disableSignUp: 'true',
          selfServeEnabled: false,
          signUpDisabled: true,
        },
      ])(
        'THEN should read self-serve $selfServe and disable-signup $disableSignUp independently',
        async ({ selfServe, disableSignUp, selfServeEnabled, signUpDisabled }) => {
          setEnvValue('LAGO_SELF_SERVE_ENABLED', selfServe)
          setEnvValue('LAGO_DISABLE_SIGNUP', disableSignUp)

          const env = await loadEnvGlobal()

          expect(env).toMatchObject({ selfServeEnabled, disableSignUp: signUpDisabled })
        },
      )
    })
  })

  describe.each([
    { envKey: 'LAGO_US_FRONT_URL', field: 'usFrontUrl', setting: 'https://app.getlago.com' },
    { envKey: 'LAGO_EU_FRONT_URL', field: 'euFrontUrl', setting: 'https://app.eu.getlago.com' },
    { envKey: 'LAGO_RECAPTCHA_SITE_KEY', field: 'recaptchaSiteKey', setting: '6LcSiteKey-123_abc' },
  ] as const)('GIVEN $envKey', ({ envKey, field, setting }) => {
    describe('WHEN it is set with surrounding whitespace', () => {
      it(`THEN should expose the trimmed value as ${field}`, async () => {
        setEnvValue(envKey, `  ${setting} \n`)

        const env = await loadEnvGlobal()

        expect(env[field]).toBe(setting)
      })
    })

    describe('WHEN it is unset or blank', () => {
      it.each([[undefined], [''], ['   ']])(
        `THEN should expose ${field} as empty for %p`,
        async (value) => {
          setEnvValue(envKey, value)

          const env = await loadEnvGlobal()

          expect(env[field]).toBe('')
        },
      )
    })
  })
})
