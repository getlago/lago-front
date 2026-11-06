type RecaptchaModule = typeof import('../recaptcha')
type Grecaptcha = NonNullable<Window['grecaptcha']>

const mockEnvGlobalVar = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  envGlobalVar: () => mockEnvGlobalVar(),
}))

const SITE_KEY = 'site-key-123'
const RECAPTCHA_SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
const RECAPTCHA_LOAD_TIMEOUT_MS = 5_000
const RECAPTCHA_TIMEOUT_MS = 10_000
const GSTATIC_LIBRARY_SRC = 'https://www.gstatic.com/recaptcha/releases/abc/recaptcha__en.js'
const FIRST_TOKEN = 'recaptcha-token-1'
const SECOND_TOKEN = 'recaptcha-token-2'

const importRecaptcha = async (): Promise<RecaptchaModule> => import('../recaptcha')

const setSiteKey = (recaptchaSiteKey: string): void => {
  mockEnvGlobalVar.mockReturnValue({ recaptchaSiteKey })
}

const getScripts = (): HTMLScriptElement[] => Array.from(document.head.querySelectorAll('script'))

const buildGrecaptcha = (execute: Grecaptcha['execute'] = jest.fn()): Grecaptcha => ({
  ready: jest.fn((callback: () => void) => callback()),
  execute,
})

const loadScript = (grecaptcha?: Grecaptcha): void => {
  window.grecaptcha = grecaptcha
  getScripts()[0].dispatchEvent(new Event('load'))
}

const failScript = (): void => {
  getScripts()[0].dispatchEvent(new Event('error'))
}

const neverReady = (): Grecaptcha => ({ ready: jest.fn(), execute: jest.fn() })

const addPageLeftovers = (): void => {
  const library = document.createElement('script')
  const badge = document.createElement('div')

  library.src = GSTATIC_LIBRARY_SRC
  badge.className = 'grecaptcha-badge'
  document.head.appendChild(library)
  document.body.appendChild(badge)
  window.___grecaptcha_cfg = {}
}

describe('recaptcha', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.useFakeTimers()
    setSiteKey(SITE_KEY)
  })

  afterEach(() => {
    jest.useRealTimers()
    getScripts().forEach((script) => script.remove())
    document.querySelectorAll('.grecaptcha-badge').forEach((badge) => badge.remove())
    delete window.grecaptcha
    delete window.___grecaptcha_cfg
  })

  describe('loadRecaptcha', () => {
    describe('GIVEN no site key is configured', () => {
      describe('WHEN loading the script', () => {
        it('THEN should resolve undefined without adding a script', async () => {
          setSiteKey('')

          const { loadRecaptcha } = await importRecaptcha()

          await expect(loadRecaptcha()).resolves.toBeUndefined()
          expect(getScripts()).toHaveLength(0)
        })
      })
    })

    describe('GIVEN a site key is configured', () => {
      describe('WHEN loading the script', () => {
        it('THEN should add the Google script rendered with the site key', async () => {
          const { loadRecaptcha } = await importRecaptcha()

          loadRecaptcha()

          expect(getScripts()).toHaveLength(1)
          expect(getScripts()[0].src).toBe(RECAPTCHA_SCRIPT_SRC)
        })

        it('THEN should resolve grecaptcha once the script has loaded', async () => {
          const grecaptcha = buildGrecaptcha()
          const { loadRecaptcha } = await importRecaptcha()

          const loading = loadRecaptcha()

          loadScript(grecaptcha)

          await expect(loading).resolves.toBe(grecaptcha)
        })
      })

      describe('WHEN loading the script several times', () => {
        it('THEN should add a single script and resolve the same grecaptcha', async () => {
          const grecaptcha = buildGrecaptcha()
          const { loadRecaptcha } = await importRecaptcha()

          const firstLoading = loadRecaptcha()
          const secondLoading = loadRecaptcha()

          loadScript(grecaptcha)

          await expect(firstLoading).resolves.toBe(grecaptcha)
          await expect(secondLoading).resolves.toBe(grecaptcha)
          await expect(loadRecaptcha()).resolves.toBe(grecaptcha)
          expect(getScripts()).toHaveLength(1)
        })
      })

      describe('WHEN the script fails to load', () => {
        it('THEN should resolve undefined and remove the script', async () => {
          const { loadRecaptcha } = await importRecaptcha()

          const loading = loadRecaptcha()

          failScript()

          await expect(loading).resolves.toBeUndefined()
          expect(getScripts()).toHaveLength(0)
        })

        it('THEN should add a new script on the next call', async () => {
          const grecaptcha = buildGrecaptcha()
          const { loadRecaptcha } = await importRecaptcha()

          const failedLoading = loadRecaptcha()

          failScript()
          await failedLoading
          await jest.advanceTimersByTimeAsync(0)

          const retriedLoading = loadRecaptcha()

          expect(getScripts()).toHaveLength(1)

          loadScript(grecaptcha)

          await expect(retriedLoading).resolves.toBe(grecaptcha)
        })
      })

      describe('WHEN the script loads without defining grecaptcha', () => {
        it('THEN should resolve undefined, remove the script and add a new one on the next call', async () => {
          const { loadRecaptcha } = await importRecaptcha()

          const loading = loadRecaptcha()

          loadScript(undefined)

          await expect(loading).resolves.toBeUndefined()
          await jest.advanceTimersByTimeAsync(0)
          expect(getScripts()).toHaveLength(0)

          loadRecaptcha()

          expect(getScripts()).toHaveLength(1)
        })
      })

      describe('WHEN grecaptcha never becomes ready', () => {
        it('THEN should resolve undefined after the load timeout and clean the page up', async () => {
          const onSettled = jest.fn()
          const { loadRecaptcha } = await importRecaptcha()

          loadRecaptcha().then(onSettled)
          loadScript(neverReady())
          addPageLeftovers()

          await jest.advanceTimersByTimeAsync(RECAPTCHA_LOAD_TIMEOUT_MS - 1)

          expect(onSettled).not.toHaveBeenCalled()

          await jest.advanceTimersByTimeAsync(1)

          expect(onSettled).toHaveBeenCalledWith(undefined)
          expect(getScripts()).toHaveLength(0)
          expect(document.querySelector('.grecaptcha-badge')).toBeNull()
          expect(window.grecaptcha).toBeUndefined()
          expect(window.___grecaptcha_cfg).toBeUndefined()
        })

        it('THEN should add a new script on the next call', async () => {
          const { loadRecaptcha } = await importRecaptcha()

          loadRecaptcha()

          const firstScript = getScripts()[0]

          loadScript(neverReady())
          await jest.advanceTimersByTimeAsync(RECAPTCHA_LOAD_TIMEOUT_MS)

          loadRecaptcha()

          expect(getScripts()).toHaveLength(1)
          expect(getScripts()[0]).not.toBe(firstScript)
        })
      })
    })
  })

  describe('unloadRecaptcha', () => {
    describe('GIVEN reCAPTCHA is loaded', () => {
      describe('WHEN unloading it', () => {
        it('THEN should remove both scripts, the badge and the globals', async () => {
          const { loadRecaptcha, unloadRecaptcha } = await importRecaptcha()

          const loading = loadRecaptcha()

          loadScript(buildGrecaptcha())
          await loading
          addPageLeftovers()

          unloadRecaptcha()

          expect(getScripts()).toHaveLength(0)
          expect(document.querySelector('.grecaptcha-badge')).toBeNull()
          expect(window.grecaptcha).toBeUndefined()
          expect(window.___grecaptcha_cfg).toBeUndefined()
        })

        it('THEN should add a new script on the next load', async () => {
          const { loadRecaptcha, unloadRecaptcha } = await importRecaptcha()

          const loading = loadRecaptcha()

          loadScript(buildGrecaptcha())
          await loading
          unloadRecaptcha()

          loadRecaptcha()

          expect(getScripts()).toHaveLength(1)
        })
      })
    })

    describe('GIVEN a load is still pending', () => {
      describe('WHEN it fails after a newer load replaced it', () => {
        it('THEN should leave the newer script in place', async () => {
          const { loadRecaptcha, unloadRecaptcha } = await importRecaptcha()

          loadRecaptcha()
          unloadRecaptcha()
          loadRecaptcha()

          const newerScript = getScripts()[0]

          await jest.advanceTimersByTimeAsync(RECAPTCHA_LOAD_TIMEOUT_MS - 1)
          window.grecaptcha = buildGrecaptcha()
          newerScript.dispatchEvent(new Event('load'))
          await jest.advanceTimersByTimeAsync(1)

          expect(getScripts()).toEqual([newerScript])
        })
      })
    })
  })

  describe('getRecaptchaToken', () => {
    describe('GIVEN no site key is configured', () => {
      describe('WHEN asking for a token', () => {
        it('THEN should resolve null without adding a script nor executing', async () => {
          setSiteKey('')

          const grecaptcha = buildGrecaptcha()
          const { getRecaptchaToken } = await importRecaptcha()

          window.grecaptcha = grecaptcha

          await expect(getRecaptchaToken('signup')).resolves.toBeNull()
          expect(getScripts()).toHaveLength(0)
          expect(grecaptcha.execute).not.toHaveBeenCalled()
        })
      })
    })

    describe('GIVEN the script loads and grecaptcha answers', () => {
      describe('WHEN asking for a token', () => {
        it('THEN should execute the action with the site key and resolve the token', async () => {
          const grecaptcha = buildGrecaptcha(jest.fn().mockResolvedValue(FIRST_TOKEN))
          const { getRecaptchaToken } = await importRecaptcha()

          const token = getRecaptchaToken('signup')

          loadScript(grecaptcha)

          await expect(token).resolves.toBe(FIRST_TOKEN)
          expect(grecaptcha.execute).toHaveBeenCalledWith(SITE_KEY, { action: 'signup' })
        })

        it('THEN should not leave its timeout running once the token arrives', async () => {
          const grecaptcha = buildGrecaptcha(jest.fn().mockResolvedValue(FIRST_TOKEN))
          const { getRecaptchaToken } = await importRecaptcha()

          const token = getRecaptchaToken('signup')

          loadScript(grecaptcha)
          await token

          expect(jest.getTimerCount()).toBe(0)
        })

        it('THEN should wait for grecaptcha to be ready before executing', async () => {
          let markReady: () => void = () => undefined
          const grecaptcha: Grecaptcha = {
            ready: (callback) => {
              markReady = callback
            },
            execute: jest.fn().mockResolvedValue(FIRST_TOKEN),
          }
          const { getRecaptchaToken } = await importRecaptcha()

          const token = getRecaptchaToken('signup')

          loadScript(grecaptcha)
          await jest.advanceTimersByTimeAsync(0)

          expect(grecaptcha.execute).not.toHaveBeenCalled()

          markReady()

          await expect(token).resolves.toBe(FIRST_TOKEN)
        })
      })

      describe('WHEN asking for a token twice', () => {
        it('THEN should reuse the script and execute again for a fresh token', async () => {
          const grecaptcha = buildGrecaptcha(
            jest.fn().mockResolvedValueOnce(FIRST_TOKEN).mockResolvedValueOnce(SECOND_TOKEN),
          )
          const { getRecaptchaToken, loadRecaptcha } = await importRecaptcha()

          loadRecaptcha()
          loadScript(grecaptcha)

          await expect(getRecaptchaToken('signup')).resolves.toBe(FIRST_TOKEN)
          await expect(getRecaptchaToken('signup')).resolves.toBe(SECOND_TOKEN)
          expect(grecaptcha.execute).toHaveBeenCalledTimes(2)
          expect(getScripts()).toHaveLength(1)
        })
      })
    })

    describe('GIVEN no token can be obtained', () => {
      describe('WHEN asking for a token', () => {
        it.each([
          ['the script fails to load', (): void => failScript()],
          ['the script loads without grecaptcha', (): void => loadScript(undefined)],
          [
            'grecaptcha rejects the execution',
            (): void =>
              loadScript(buildGrecaptcha(jest.fn().mockRejectedValue(new Error('execute failed')))),
          ],
        ])('THEN should resolve null when %s', async (_, settleScript) => {
          const { getRecaptchaToken } = await importRecaptcha()

          const token = getRecaptchaToken('signup')

          settleScript()

          await expect(token).resolves.toBeNull()
        })
      })
    })

    describe('GIVEN grecaptcha throws while executing', () => {
      describe('WHEN asking for a token', () => {
        it.each([
          ['synchronously', (callback: () => void): void => callback()],
          [
            'asynchronously',
            (callback: () => void): void => {
              setTimeout(callback, 0)
            },
          ],
        ])('THEN should resolve null right away when ready calls back %s', async (_, ready) => {
          const onSettled = jest.fn()
          const { getRecaptchaToken } = await importRecaptcha()

          getRecaptchaToken('signup').then(onSettled)
          loadScript({
            ready,
            execute: jest.fn(() => {
              throw new Error('Invalid site key or not loaded in api.js')
            }),
          })

          await jest.advanceTimersByTimeAsync(0)

          expect(onSettled).toHaveBeenCalledWith(null)
        })
      })
    })

    describe('GIVEN nothing answers', () => {
      describe('WHEN the load timeout elapses', () => {
        it.each([
          ['the script never loads', (): void => undefined],
          ['grecaptcha never becomes ready', (): void => loadScript(neverReady())],
        ])('THEN should resolve null when %s', async (_, settleScript) => {
          const onSettled = jest.fn()
          const { getRecaptchaToken } = await importRecaptcha()

          getRecaptchaToken('signup').then(onSettled)
          settleScript()

          await jest.advanceTimersByTimeAsync(RECAPTCHA_LOAD_TIMEOUT_MS - 1)

          expect(onSettled).not.toHaveBeenCalled()

          await jest.advanceTimersByTimeAsync(1)

          expect(onSettled).toHaveBeenCalledWith(null)
        })
      })

      describe('WHEN the token timeout elapses', () => {
        it('THEN should resolve null when grecaptcha never answers the execution', async () => {
          const onSettled = jest.fn()
          const { getRecaptchaToken } = await importRecaptcha()

          getRecaptchaToken('signup').then(onSettled)
          loadScript(buildGrecaptcha(jest.fn(() => new Promise<string>(() => {}))))

          await jest.advanceTimersByTimeAsync(RECAPTCHA_TIMEOUT_MS - 1)

          expect(onSettled).not.toHaveBeenCalled()

          await jest.advanceTimersByTimeAsync(1)

          expect(onSettled).toHaveBeenCalledWith(null)
        })
      })
    })
  })
})
